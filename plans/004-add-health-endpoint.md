# 004 — Add a real `/api/v1/health` endpoint

Status: TODO
Written against commit: `6afe742`
Category: Ops / Test coverage | Impact: Medium-High | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/api` is a NestJS 10 app. `scripts/deploy.sh:105` prints
`https://api.$DOMAIN/api/v1/health` as the post-deploy "here's your API" URL, implying a health
endpoint exists — but no `health` module, controller, or `@Get("health")` route exists anywhere in
`apps/api/src`. There is currently **no** verification endpoint of any kind in this codebase — not
a smoke test, not a Postman collection, nothing. This is the cheapest possible first step toward a
verification safety net (a project that otherwise has zero automated tests and zero CI).

## Current state

Confirmed via directory listing of `apps/api/src` (verbatim, all 27 module directories):
```
ab-tests, admin, affiliate, analytics, appointments, audience, auth, auto-reply,
content-plans, coupons, courses, digital-files, domains, email, flash-sales,
gateway-callback, growth, orders, payments, products, redis, shipping, shops,
short-links, sms, tickets, upload, users, blocks, common, prisma
```
No `health` directory. No `@Get("health")` anywhere (`grep -rn "health" apps/api/src` returns
nothing route-related).

`apps/api/src/app.module.ts:37-78` — the module import list every new feature module gets added
to:
```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: "../../.env" }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ServeStaticModule.forRoot({ /* ... */ }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ShopsModule,
    BlocksModule,
    UploadModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
    PaymentsModule,
    GatewayCallbackModule,
    AnalyticsModule,
    TicketsModule,
    AdminModule,
    EmailModule,
    DomainsModule,
    AbTestsModule,
    ShippingModule,
    ContentPlansModule,
    DigitalFilesModule,
    CoursesModule,
    AppointmentsModule,
    ShortLinksModule,
    AudienceModule,
    AffiliateModule,
    AutoReplyModule,
    FlashSalesModule,
    GrowthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

`apps/api/src/main.ts:76`: `app.setGlobalPrefix(process.env.API_PREFIX || "api/v1");` — confirms
the route will need to be `GET /health` in the controller (Nest prepends the global prefix
automatically), landing at `/api/v1/health` in production, matching what `deploy.sh` already
expects.

Existing module convention to follow — `apps/api/src/blocks/` structure (module + controller +
service, no DTO needed here since there's no request body):
```
blocks/
  blocks.controller.ts
  blocks.module.ts
  blocks.service.ts
  dto/
```

## What to do

### Step 1 — Create the health module

Create `apps/api/src/health/health.module.ts`:
```ts
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

Create `apps/api/src/health/health.controller.ts`. Keep it genuinely useful — check the one
dependency most likely to silently fail (the database) rather than just returning a static 200,
since a static 200 would not have caught, e.g., a Postgres connection exhaustion or wrong
`DATABASE_URL` after a deploy:

```ts
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      throw new ServiceUnavailableException("Database unreachable");
    }
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
```

Check `apps/api/src/prisma/prisma.module.ts` first to confirm it exports `PrismaService` (it
should, since every other module injects it the same way — e.g. `ShopsService`'s constructor).
If `PrismaModule` is marked `@Global()` already, the explicit `imports: [PrismaModule]` in
`HealthModule` is redundant but harmless — check and match whatever the existing convention is
across 2-3 other feature modules before deciding.

### Step 2 — Register the module

Edit `apps/api/src/app.module.ts`. Add the import at the top near the other module imports
(alphabetical-ish order isn't strictly enforced in the existing list, so just add it near
`PrismaModule`/`RedisModule` since it's an infra-level module, not a feature module):

```ts
import { HealthModule } from "./health/health.module";
```

And add `HealthModule` to the `imports` array (again, near `PrismaModule, RedisModule,`).

### Step 3 — Confirm the route is NOT behind global auth

This app does not appear to use a global `APP_GUARD` for auth (only `ThrottlerGuard` is global,
per `app.module.ts:79` — `providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]`). Auth
guards are applied per-controller (e.g. `@UseGuards(JwtAuthGuard)` on `UploadController`). Since
`HealthController` above has no `@UseGuards(...)` decorator, it will be public by default — this
is intentional and correct for a health check (a deploy script or uptime monitor calling it has no
JWT). Do not add an auth guard to this controller.

### Step 4 (optional, do only if Step 1-3 verify cleanly) — Make deploy.sh actually check it

`scripts/deploy.sh:105` currently just echoes the URL, it never curls it. Since this script isn't
part of the project's actual current deploy process (per plan 003's note), this step is optional
polish, not required for this finding to be resolved. If you do it, add right before the final
`echo "  ✅ Deploy Complete!"` block:
```bash
echo "🩺 Checking API health..."
sleep 3
if curl -fsS "http://localhost:${API_PORT:-4000}/api/v1/health" > /dev/null; then
  echo "✅ Health check passed"
else
  echo "⚠️  Health check failed — API may not be responding"
fi
```
Only do this if you're confident about the container's internal port/network setup from reading
the rest of `docker-compose.prod.yml` — if unsure, skip Step 4 entirely and leave a note; it's not
required for the core finding.

## Files in scope

- `apps/api/src/health/health.module.ts` (new)
- `apps/api/src/health/health.controller.ts` (new)
- `apps/api/src/app.module.ts` (add one import line + one array entry)
- `scripts/deploy.sh` (optional, Step 4 only)

## Explicitly out of scope — do not touch

- Do not add a `health.service.ts` — the controller is simple enough to talk to `PrismaService`
  directly, matching the project's convention of keeping trivial modules lean (compare
  `TicketsModule` or similar small modules before assuming a service file is mandatory, but don't
  add one just for consistency if it adds no logic).
- Do not add Redis connectivity checks, disk space checks, or other health-check sophistication —
  scope this to "is the process up and can it reach Postgres," matching the actual failure mode
  this project has already experienced (wrong `DATABASE_URL` / connection issues after a deploy).
- Do not touch any of the 27 existing feature modules.

## Verification

1. `pnpm --filter @weelink/api dev` (or however local dev is started per README) against a local
   Postgres (via `docker-compose up -d` per README Step 3).
2. `curl -i http://localhost:4000/api/v1/health` — expected: HTTP 200, JSON body
   `{"status":"ok","timestamp":"..."}` (note: this app wraps responses in `ResponseInterceptor`
   per `main.ts:88` — check what the actual response envelope looks like by comparing to another
   simple `GET` endpoint's response shape, e.g. `GET /api/v1/shops/:slug`, and confirm the health
   response matches that same envelope convention).
3. Stop the local Postgres container (`docker compose stop postgres`) and `curl -i
   http://localhost:4000/api/v1/health` again — expected: HTTP 503, not a hang or unhandled
   exception/500.
4. Restart Postgres, confirm the endpoint returns to 200.
5. `pnpm --filter @weelink/api build` — must compile with no TypeScript errors.

## Maintenance note

This is the foundation a future characterization-test or CI health-gate would build on. It doesn't
by itself add CI (there is none, and none is being added by this plan) — it just makes the
endpoint `deploy.sh` already assumes actually exist and work.
