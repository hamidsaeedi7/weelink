# 007 — Add per-phone OTP send rate limit

Status: DONE — executed and live-verified in production
Written against commit: `6afe742`
Category: Abuse / Auth | Impact: Medium | Effort: S | Risk of fix: Low | Confidence: Medium

## Context

`apps/api/src/auth/auth.service.ts` sends a 6-digit OTP via SMS (Kavenegar in production, per
`SMS_PROVIDER` env var) for both registration and login. `apps/api/src/auth/auth.controller.ts`
applies `@Throttle({ default: { limit: 5, ttl: 60000 } })` (5 requests/minute) on the relevant
routes, but NestJS's default throttler keys by **IP address**, not by the phone number in the
request body. Someone controlling multiple IPs (a small residential proxy pool, cheaply available)
can send unlimited OTP SMS messages to one specific victim phone number, which is a real-money cost
abuse vector against Kavenegar's per-SMS billing, and a harassment vector against the phone's owner.

## Current state (verbatim)

`apps/api/src/auth/auth.service.ts:31-41` (register):
```ts
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException("این شماره موبایل قبلاً ثبت شده است");

    const code = this.sms.generateOtp();
    const sent = await this.sms.sendOtp(dto.phone, code);
    if (!sent) throw new BadRequestException("ارسال پیامک ناموفق بود، دوباره تلاش کنید");
    await this.redis.set(`otp:${dto.phone}`, code, 120);

    return { message: "کد تأیید ارسال شد", phone: dto.phone };
  }
```

`apps/api/src/auth/auth.service.ts:117-127` (login):
```ts
  async sendLoginOtp(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (user?.isBlocked) throw new UnauthorizedException("حساب کاربری مسدود شده است");

    const code = this.sms.generateOtp();
    const sent = await this.sms.sendOtp(phone, code);
    if (!sent) throw new BadRequestException("ارسال پیامک ناموفق بود، دوباره تلاش کنید");
    // همان کلید ثبت‌نام تا verify-otp برای ورود و ثبت‌نام یکسان کار کند
    await this.redis.set(`otp:${phone}`, code, 120);
    return { message: "کد ورود ارسال شد" };
  }
```

`apps/api/src/redis/redis.service.ts` (full file, so you know exactly what's available to reuse —
note there is **no** atomic increment method today):
```ts
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  // ...
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> { /* setex or set */ }
  async get(key: string): Promise<string | null> { /* client.get */ }
  async del(key: string): Promise<void> { /* client.del */ }
  async exists(key: string): Promise<boolean> { /* client.exists === 1 */ }
  async ttl(key: string): Promise<number> { /* client.ttl */ }
}
```

`apps/api/src/auth/auth.controller.ts` — confirmed `@Throttle` decorators exist on `register`
(line 20), `login-otp`/`sendLoginOtp` (line 38), and two more routes (lines 26, 32, 56, 62) — all
`{ limit: 5, ttl: 60000 }` or `{ limit: 3, ttl: 60000 }`, all keyed by NestJS's default (IP-based)
throttler storage.

## Why this matters

The IP-based throttle already in place is real protection against a *single-source* burst, but does
nothing against a distributed one targeting one phone number. Since OTP-send is the exact operation
that costs real money per call (SMS gateway billing) and can be weaponized as harassment (repeated
SMS to a stranger's phone), a per-phone cap is the more important of the two limits and is
currently entirely missing.

## What to do

### Step 1 — Add an atomic increment-with-TTL method to `RedisService`

Edit `apps/api/src/redis/redis.service.ts`, add a new method (ioredis's `incr` + `expire` needs to
be atomic to avoid a race where a key gets created without its TTL under concurrent requests — use
a Lua-free approach with `multi()` since ioredis supports pipelining, which is simpler and
sufficient here given this doesn't need to be perfectly race-proof, just correct in the common
case):

```ts
  /** Atomically increments a counter, setting its TTL only on first creation. Returns the new count. */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const result = await this.client
      .multi()
      .incr(key)
      .expire(key, ttlSeconds, "NX") // NX: only set TTL if the key has none yet
      .exec();
    const count = result?.[0]?.[1] as number;
    return count;
  }
```

Check the installed `ioredis` version's `expire` signature supports the `"NX"` flag (added in
Redis 7.0 / ioredis versions that support it — `apps/api/package.json` lists `"ioredis": "^5.4.2"`,
which does support `EXPIRE key seconds NX`). If for any reason it doesn't work as expected during
Verification, fall back to a simpler (slightly racy but acceptable for a rate-limit, not a
security-critical lock) version:
```ts
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, ttlSeconds);
    return count;
  }
```
Use whichever version actually passes Verification Step 2 below — don't guess, test both if the
first one behaves unexpectedly.

### Step 2 — Enforce the cap in `AuthService`

Edit `apps/api/src/auth/auth.service.ts`. Add a small private helper and call it from both
`register` and `sendLoginOtp`, before generating/sending the OTP:

```ts
  private readonly OTP_MAX_PER_HOUR = 5;

  private async assertOtpRateLimit(phone: string) {
    const count = await this.redis.incrWithTtl(`otp:ratelimit:${phone}`, 3600);
    if (count > this.OTP_MAX_PER_HOUR) {
      throw new BadRequestException(
        "تعداد درخواست‌های کد تأیید برای این شماره در یک ساعت اخیر بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
      );
    }
  }
```

In `register` (before the `const code = this.sms.generateOtp();` line):
```ts
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException("این شماره موبایل قبلاً ثبت شده است");

    await this.assertOtpRateLimit(dto.phone);

    const code = this.sms.generateOtp();
    // ...unchanged
```

In `sendLoginOtp` (before the `const code = this.sms.generateOtp();` line):
```ts
  async sendLoginOtp(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (user?.isBlocked) throw new UnauthorizedException("حساب کاربری مسدود شده است");

    await this.assertOtpRateLimit(phone);

    const code = this.sms.generateOtp();
    // ...unchanged
```

`OTP_MAX_PER_HOUR = 5` is a starting value chosen to comfortably cover legitimate retries (typo'd
phone number, SMS delay, etc.) while capping abuse cost — this is a product/ops judgment call, not
a hard technical constraint. If the user wants a different number, that's a one-line change; don't
treat `5` as sacred.

### Step 3 — Check for other OTP-send call sites

`grep -n "generateOtp\|sms.sendOtp" apps/api/src/auth/auth.service.ts` to confirm there isn't a
third OTP-sending method beyond `register` and `sendLoginOtp` (e.g. a "resend OTP" or
forgot-password-triggered send) that also needs the same `assertOtpRateLimit` call. If one exists,
add the same guard there and note it when reporting back.

## Files in scope

- `apps/api/src/redis/redis.service.ts` (add `incrWithTtl` method)
- `apps/api/src/auth/auth.service.ts` (add `assertOtpRateLimit` + call sites)

## Explicitly out of scope — do not touch

- `apps/api/src/auth/auth.controller.ts`'s existing `@Throttle` decorators — leave the IP-based
  throttling exactly as-is; this plan adds a second, complementary layer, it doesn't replace the
  first one.
- Do not change the existing `otp:${phone}` key (the actual OTP code storage, `redis.set(...,
  120)`) — the new rate-limit key (`otp:ratelimit:${phone}`) is intentionally separate with its
  own 1-hour TTL, distinct from the 120-second OTP-code TTL. Don't merge them.
- Do not add CAPTCHA or any other verification layer — out of scope for this finding.

## Verification

1. `pnpm --filter @weelink/api build` — must compile with no TypeScript errors.
2. Directly test `incrWithTtl` against a local Redis (via a quick throwaway script or the Nest
   REPL if available): call it 3 times in a row for the same key with `ttlSeconds=60`, confirm it
   returns `1, 2, 3`, and confirm via `redis-cli TTL <key>` that the TTL is set once (~60s) and
   does NOT reset to 60 again on the 2nd/3rd call (only the 1st call should set it).
3. Call `POST /api/v1/auth/login-otp` with the same phone number 6 times in a row (bypass the
   IP-throttle for this test by either waiting between calls or temporarily testing with the
   throttle's window, since IP-throttle is `limit: 5, ttl: 60000` — you may need to either test
   patiently across the throttle window or add a temporary local-only bypass for manual testing,
   then remove it). Expected: the 6th call returns the new Persian rate-limit error message, not a
   generic 429 from the IP throttler and not a successful OTP send.
4. Confirm a *different* phone number can still successfully request an OTP immediately after the
   above test — confirms the rate limit is correctly scoped per-phone, not global.
5. Confirm the existing login/registration flow still works end-to-end for a normal (non-abusive)
   user through the web UI — one real OTP request and verify should succeed exactly as before.

## Maintenance note

If a future admin panel needs to inspect or manually clear a phone's rate-limit lockout (e.g. a
support request "I'm locked out, please help"), it would read/delete the
`otp:ratelimit:{phone}` Redis key — that's a reasonable, low-risk admin action to add later if
needed, but is not part of this plan.
