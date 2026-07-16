# 009 — Extend the production boot guard to `API_URL`/`WEB_URL` (payment path)

Status: DONE — executed and live-verified in production
Written against commit: `6afe742`
Category: Env/Config safety | Impact: High | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/api/src/main.ts:16-35` has an `assertProductionConfig()` function that runs at boot and
fails fast (throws, preventing the process from starting) if `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, or `FRONTEND_URL` are missing or left at their placeholder/localhost values
in production. This exact pattern — "silently fall back to `localhost`" — already caused a real
production incident earlier in this project's history (a Next.js build baked
`NEXT_PUBLIC_API_URL || "http://localhost:4000"` into a production bundle because the env var
wasn't set at build time, breaking every API call site-wide until caught and fixed). The backend
has the identical fallback shape on its own **payment callback path**, and it was never added to
the boot guard.

This plan is scoped narrowly to the backend, payment-critical instances only — a full sweep of
every `|| "http://localhost..."` occurrence in the repo (30+ files, mostly in `apps/web`) was
explicitly considered and rejected as this round's scope; see "Explicitly out of scope" below.

## Current state (verbatim)

`apps/api/src/main.ts:1-38` (the guard as it exists today):
```ts
const WEAK_SECRET_VALUES = new Set([
  "",
  "change_this_to_a_very_long_random_secret_access",
  "change_this_to_a_very_long_random_secret_refresh",
]);

function assertProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || WEAK_SECRET_VALUES.has(accessSecret)) {
    throw new Error("JWT_ACCESS_SECRET is missing or using the default placeholder value");
  }
  if (!refreshSecret || WEAK_SECRET_VALUES.has(refreshSecret)) {
    throw new Error("JWT_REFRESH_SECRET is missing or using the default placeholder value");
  }
  if (accessSecret === refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl || frontendUrl.includes("localhost")) {
    throw new Error("FRONTEND_URL must be set to the production domain");
  }
}
```

The backend files that build URLs with the same fragile `|| "http://localhost:..."` pattern, NOT
covered by the guard above:
```
apps/api/src/orders/orders.service.ts:9                   const API_URL = process.env.API_URL || "http://localhost:4000";
apps/api/src/digital-files/digital-files.service.ts:7      const API_URL = process.env.API_URL || "http://localhost:4000";
apps/api/src/courses/courses.service.ts:10                 const API_URL = process.env.API_URL || "http://localhost:4000";
apps/api/src/payments/payments.controller.ts:8             const WEB_URL = process.env.WEB_URL || process.env.FRONTEND_URL || "http://localhost:3000";
apps/api/src/gateway-callback/gateway-callback.controller.ts:8  const WEB_URL = process.env.WEB_URL || process.env.FRONTEND_URL || "http://localhost:3000";
```
`API_URL` builds the payment-gateway **callback URL** (where Zarinpal/Zibal redirects after
payment); `WEB_URL`/`FRONTEND_URL` builds the **post-payment redirect URL** shown to the customer.
If either silently falls back to `localhost` in production, the payment flow breaks for real
paying customers — the exact class of incident that already happened once, just on a different var.

Currently `WEB_URL` is *partially* protected already (it falls back to `FRONTEND_URL`, which the
existing guard already checks isn't `localhost`) — so the two controllers above are latently safe
today only because `FRONTEND_URL` happens to also be set correctly in production. `API_URL` has
**no fallback protection at all** — nothing currently guards it, and it's the more dangerous of the
two because a wrong value breaks the payment gateway callback itself (the gateway would try to
reach `http://localhost:4000/...` from Zarinpal's/Zibal's own servers, which will simply fail).

## What to do

Edit `apps/api/src/main.ts`. Add two checks to `assertProductionConfig()`, after the existing
`frontendUrl` check (same function, same style, same "throw a descriptive Error" pattern):

```ts
  const apiUrl = process.env.API_URL;
  if (!apiUrl || apiUrl.includes("localhost")) {
    throw new Error("API_URL must be set to the production API domain (used in payment gateway callback URLs)");
  }

  const webUrl = process.env.WEB_URL || process.env.FRONTEND_URL;
  if (!webUrl || webUrl.includes("localhost")) {
    throw new Error("WEB_URL (or FRONTEND_URL) must be set to the production web domain (used in post-payment redirects)");
  }
```

That's the entire functional change — one function, two new checks, following the exact pattern
already established for `frontendUrl` two lines above.

## Files in scope

- `apps/api/src/main.ts` (only the `assertProductionConfig` function — add ~8 lines, no other edits)

## Explicitly out of scope — do not touch

- Do not touch the 5 files listed above (`orders.service.ts`, `digital-files.service.ts`,
  `courses.service.ts`, `payments.controller.ts`, `gateway-callback.controller.ts`) themselves —
  this plan does not change how they read `API_URL`/`WEB_URL`, it only guarantees the process won't
  boot in production if those values are wrong. Centralizing the 5 scattered declarations into a
  single shared config module is a reasonable future refactor but was explicitly considered and
  rejected as out of scope for this round — it touches more files for no additional safety benefit
  once the boot guard is in place.
- Do not touch the 30+ frontend (`apps/web`) files with the analogous `NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"` pattern — those are a `next build`-time concern (the value gets baked
  into the client bundle at build, not read at server boot), which this runtime boot-guard
  mechanism cannot protect against the same way; fixing them would need a build-time check (e.g. in
  the CI/build pipeline, which doesn't exist yet — see the audit's DX findings) rather than this
  `main.ts` guard. Treat that as a distinct, unscoped finding, not part of this plan.
- Do not add checks for `ARVAN_API_KEY` or `TELEGRAM_*` to this guard — those govern optional
  features (custom domains, Telegram auto-posting) that already fail soft by design (confirmed:
  `arvan-cdn.service.ts` returns a soft error rather than crashing, and `scheduler.service.ts`
  explicitly documents Telegram failing soft because the API is filtered on the production server).
  Forcing the whole API to refuse to boot over an optional integration's unset key would be a
  regression, not a fix.

## Verification

1. `pnpm --filter @weelink/api build` — must compile with no TypeScript errors.
2. Start the API locally with `NODE_ENV=production` set but `API_URL` unset (or set to
   `http://localhost:4000`), all other required vars (JWT secrets, `FRONTEND_URL`) set correctly.
   Expected: process throws the new `API_URL` error and refuses to boot.
3. Same test with `WEB_URL` and `FRONTEND_URL` both unset/localhost. Expected: process throws the
   new `WEB_URL` error.
4. Same test with `FRONTEND_URL` set to a real production domain and `API_URL` also set correctly,
   `WEB_URL` left unset. Expected: boots successfully — confirms the `WEB_URL || FRONTEND_URL`
   fallback inside the guard itself still works as intended (this mirrors how the actual production
   `.env.prod` is currently configured, per earlier session history: `API_URL` present, `WEB_URL`
   absent, `FRONTEND_URL` present).
5. With `NODE_ENV` unset or `development`, confirm none of these new checks run (the function's
   first line `if (process.env.NODE_ENV !== "production") return;` should make Steps 2-4
   irrelevant in dev) — verify the API still boots fine locally with the existing dev `.env.example`
   defaults, completely unaffected by this change.
6. Confirm the actual current production `.env.prod` (do not print its contents, just confirm
   presence/absence of the right keys via `ssh <prod-host> "grep -c '^API_URL=' /path/to/.env.prod"`
   or equivalent) already satisfies these new checks, so that deploying this change does NOT
   accidentally take production down on next restart. If it would fail the new check, **stop and
   report back** rather than deploying — that means production is currently relying on the exact
   fallback this plan is meant to eliminate, and the env file needs fixing first, not the code.

## Maintenance note

Any future env var that flows into a customer-facing URL (redirect, callback, webhook target)
should get the same fail-fast treatment in `assertProductionConfig()` at the time it's introduced,
rather than waiting for it to cause an incident first — this project has now had this exact bug
shape happen at least twice (frontend `NEXT_PUBLIC_API_URL`, and this backend `API_URL`/`WEB_URL`
case).
