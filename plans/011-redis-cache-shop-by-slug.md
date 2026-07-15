# 011 — Add Redis cache for the shop-by-slug lookup

Status: TODO
Written against commit: `6afe742`
Category: Performance | Impact: High | Effort: M | Risk of fix: Low | Confidence: High

## Context

`ShopsService.findBySlug` (`apps/api/src/shops/shops.service.ts:31-55`) is the query behind every
public bio-page view — the single highest-traffic read in this application. It runs a full
Postgres query with 3 joined relations (`blocks`, `bankCards`, `user`) on **every** request, with
zero caching, even though Redis is already a first-class dependency of this app (used for
OTP/session data, payment transaction state) and completely unused for this purpose.

## Current state (verbatim, `apps/api/src/shops/shops.service.ts:31-55`)

```ts
  async findBySlug(slug: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        bankCards: { where: { isActive: true }, take: 1 },
        user: { select: { plan: true } },
      },
    });
    if (!shop || !shop.isActive) throw new NotFoundException("صفحه بیو یافت نشد");
    // Expose only the owner's plan (drives the free "Made with Weelink" badge)
    const { user, bankCards, ...rest } = shop as any;
    const activeCard = bankCards?.[0];
    return {
      ...rest,
      ownerPlan: user?.plan ?? "FREE",
      // Flattened for backward compat with checkout/booking/PurchaseModal
      cardNumber: activeCard?.cardNumber ?? null,
      cardHolder: activeCard?.cardHolder ?? null,
      bankName: activeCard?.bankName ?? null,
    };
  }
```

`RedisService` (`apps/api/src/redis/redis.service.ts`, full API available):
```ts
async set(key: string, value: string, ttlSeconds?: number): Promise<void>
async get(key: string): Promise<string | null>
async del(key: string): Promise<void>
async exists(key: string): Promise<boolean>
async ttl(key: string): Promise<number>
```

Callers who mutate data that `findBySlug`'s response depends on, and therefore need to invalidate
the cache (each verified by reading the actual file):
- `ShopsService.update()` (`shops.service.ts:147-166`) — shop's own fields (name, bio, colors,
  `isActive`, and `slug` itself — a shop can rename its slug, per the `dto.slug !== shop.slug`
  check on line 160).
- `ShopsService.createBankCard` / `updateBankCard` / `deleteBankCard` / `activateBankCard`
  (`shops.service.ts:101-145`) — `findBySlug` embeds the active bank card's flattened fields.
- `BlocksService.create` / `update` / `remove` / `reorder` (`apps/api/src/blocks/blocks.service.ts:59-108`)
  — `findBySlug` embeds the active, ordered block list.

`BlocksModule` (`apps/api/src/blocks/blocks.module.ts`) currently does **not** import `ShopsModule`.
`ShopsModule` (`apps/api/src/shops/shops.module.ts`) already `exports: [ShopsService]`.

## What to do

### Step 1 — Add cache read/write to `findBySlug`

Edit `apps/api/src/shops/shops.service.ts`. Inject `RedisService` into the constructor:

```ts
import { RedisService } from "../redis/redis.service";

@Injectable()
export class ShopsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}
```

Add a cache-key helper and TTL constant near the top of the class:
```ts
  private static readonly SHOP_CACHE_TTL = 120; // seconds — short, since mutations also invalidate explicitly
  private shopCacheKey(slug: string) {
    return `shop:bySlug:${slug}`;
  }
```

Rewrite `findBySlug`:
```ts
  async findBySlug(slug: string) {
    const cacheKey = this.shopCacheKey(slug);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const shop = await this.prisma.shop.findUnique({
      where: { slug },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        bankCards: { where: { isActive: true }, take: 1 },
        user: { select: { plan: true } },
      },
    });
    if (!shop || !shop.isActive) throw new NotFoundException("صفحه بیو یافت نشد");
    // Expose only the owner's plan (drives the free "Made with Weelink" badge)
    const { user, bankCards, ...rest } = shop as any;
    const activeCard = bankCards?.[0];
    const result = {
      ...rest,
      ownerPlan: user?.plan ?? "FREE",
      // Flattened for backward compat with checkout/booking/PurchaseModal
      cardNumber: activeCard?.cardNumber ?? null,
      cardHolder: activeCard?.cardHolder ?? null,
      bankName: activeCard?.bankName ?? null,
    };
    await this.redis.set(cacheKey, JSON.stringify(result), ShopsService.SHOP_CACHE_TTL);
    return result;
  }
```

**Important — do not cache the "not found" case.** The `if (!shop || !shop.isActive) throw ...`
happens before the `redis.set` call above, so a 404 is never cached. Keep it that way; caching
404s would make a newly-created shop invisible for up to the TTL window after creation.

### Step 2 — Add a public invalidation method

Add this method to `ShopsService` (public, so other services/itself can call it):
```ts
  async invalidateSlugCache(slug: string): Promise<void> {
    await this.redis.del(this.shopCacheKey(slug));
  }

  /** For callers that only have a shopId (e.g. BlocksService), not the slug directly. */
  async invalidateSlugCacheByShopId(shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } });
    if (shop) await this.invalidateSlugCache(shop.slug);
  }
```

### Step 3 — Call invalidation from every mutation path within `ShopsService`

In `update()` (`shops.service.ts:147-166`), after the `this.prisma.shop.update(...)` call succeeds,
invalidate **both** the old and new slug (a rename must not leave the old slug's cache entry
serving stale "this page exists" data until TTL expiry):
```ts
  async update(userId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { userId },
      include: { user: { select: { plan: true } } },
    });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    // ...existing validation unchanged...

    const updated = await this.prisma.shop.update({ where: { userId }, data: dto });
    await this.invalidateSlugCache(shop.slug);
    if (dto.slug && dto.slug !== shop.slug) await this.invalidateSlugCache(updated.slug);
    return updated;
  }
```

In each bank-card method (`createBankCard`, `updateBankCard`, `deleteBankCard`,
`activateBankCard` — `shops.service.ts:101-145`), each already fetches the `shop` record (which
includes `slug`) before doing its mutation. Add `await this.invalidateSlugCache(shop.slug);`
immediately before each method's `return` statement (after the mutation, not before).

### Step 4 — Call invalidation from `BlocksService`

`BlocksService` needs access to `ShopsService`. Edit `apps/api/src/blocks/blocks.module.ts`:
```ts
import { Module } from "@nestjs/common";
import { BlocksService } from "./blocks.service";
import { BlocksController, BlocksPublicController } from "./blocks.controller";
import { ShopsModule } from "../shops/shops.module";

@Module({
  imports: [ShopsModule],
  providers: [BlocksService],
  controllers: [BlocksController, BlocksPublicController],
})
export class BlocksModule {}
```

Edit `apps/api/src/blocks/blocks.service.ts`, inject `ShopsService`:
```ts
import { ShopsService } from "../shops/shops.service";

@Injectable()
export class BlocksService {
  constructor(
    private prisma: PrismaService,
    private shops: ShopsService,
  ) {}
```

Add `await this.shops.invalidateSlugCacheByShopId(shopId);` after the mutation in each of `create`
(after line 71's `return` — restructure to await the create, invalidate, then return),
`update` (`blocks.service.ts:82-87`), `remove` (`blocks.service.ts:89-95`), and `reorder`
(`blocks.service.ts:97-108`). Do **not** add it to `recordClick` (`blocks.service.ts:110-122`) —
click-count increments don't appear in `findBySlug`'s response shape at all, so invalidating on
every click would add cache-miss load on the hottest possible path (every single visitor
interaction) for zero benefit.

Example for `update`:
```ts
  async update(userId: string, id: string, dto: Partial<CreateBlockDto>) {
    const block = await this.prisma.block.findUnique({ where: { id }, include: { shop: true } });
    if (!block) throw new NotFoundException("بلوک یافت نشد");
    if (block.shop.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.block.update({ where: { id }, data: this.sanitize(dto) });
    await this.shops.invalidateSlugCacheByShopId(block.shopId);
    return updated;
  }
```
Follow the same pattern (mutate, then invalidate using the `shopId` already available in scope in
each method, then return) for `create`, `remove`, and `reorder`.

## Files in scope

- `apps/api/src/shops/shops.service.ts`
- `apps/api/src/blocks/blocks.module.ts`
- `apps/api/src/blocks/blocks.service.ts`

## Explicitly out of scope — do not touch

- Do not add caching to `findByUser`, `checkSlug`, `getAllPublicSlugs`, or any other `ShopsService`
  method — this plan is scoped to `findBySlug` only, the one confirmed hot path.
- Do not add cache invalidation to `ShopsService.create()` or `BlocksService`'s internal
  `getShopId`'s auto-create branch — a brand-new shop has no cache entry yet (nothing to
  invalidate), so there's nothing to do there.
- Do not touch `recordPageView` (`shops.service.ts:173-181`) — analytics writes don't affect
  `findBySlug`'s cached payload.
- Do not introduce a generic/reusable caching decorator or abstraction (e.g. a `@Cacheable()`
  decorator) as part of this plan — that's a larger architectural investment or covered by a
  separate finding about establishing a shared caching layer; this plan applies the fix directly
  and manually to the one confirmed hot path.
- Do not change the TTL below 120s or above a few minutes without discussing with the user first —
  120s is a deliberate balance (short enough that even a missed invalidation path self-heals
  quickly, long enough to meaningfully cut DB load); if you find you need a much longer TTL to see
  a real load reduction, that's a signal to revisit the invalidation coverage instead of just
  raising the number.

## Verification

1. `pnpm --filter @weelink/api build` — must compile with no TypeScript errors (check for a
   circular-dependency error between `ShopsModule`/`BlocksModule` specifically — if Nest's DI
   throws a circular dependency error at boot, `ShopsModule` does not import `BlocksModule`
   anywhere currently, so this should be a clean one-directional dependency; if it's not, STOP and
   report back rather than reaching for `forwardRef()` blindly).
2. Start the API locally. `curl http://localhost:4000/api/v1/shops/<real-slug>` twice in a row,
   and check logs/instrumentation (add a temporary `console.log` during testing only, remove
   before finishing) to confirm the 2nd call hits Redis, not Postgres.
3. Via the dashboard UI (or API directly), edit that shop's `name` field. Immediately
   `curl`/reload the public bio page. Expected: the new name appears immediately — NOT the stale
   cached value, confirming `update()`'s invalidation works.
4. Add/reorder/delete a block via the dashboard. Immediately reload the public bio page. Expected:
   the block list reflects the change immediately.
5. Add/activate a bank card. Immediately load the public bio page (or checkout page that reads
   `cardNumber`/`cardHolder`/`bankName`). Expected: reflects the change immediately.
6. Rename a shop's slug via `update()`. Confirm the OLD slug's URL now 404s immediately (not after
   TTL expiry) and the NEW slug's URL serves the shop correctly.
7. `redis-cli KEYS "shop:bySlug:*"` after some traffic — confirm keys are being created and expire
   naturally (check `TTL` on one) — and confirm key count is proportional to distinct shops visited
   recently, not growing unbounded.
8. Load-test informally: repeatedly `curl` the same slug 50 times, compare response time
   before/after this change (rough, not a formal benchmark) — expect a meaningful drop on cache
   hits.

## Maintenance note

Any future field added to `Shop`, `Block`, or `BankCard` that should appear in the public bio-page
response must be added inside the existing `findBySlug` include/mapping — that part of this plan is
unchanged from before. But any future *mutation* method on those same models (a new
`ShopsService`/`BlocksService` method, or a new service that touches these tables directly) must
remember to call `invalidateSlugCache`/`invalidateSlugCacheByShopId` too, or it will introduce a
silent stale-cache bug. This is the main risk of this plan's approach (manual invalidation at each
call site rather than time-based-only) — flag it clearly in code review conventions if this
project ever adopts a lint rule or checklist for new Prisma mutations on these two models.
