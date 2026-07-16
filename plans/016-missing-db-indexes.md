# 016 — Add missing indexes on `Order` and `Coupon`

Status: TODO
Written against commit: `74e98a3`
Category: Database | Impact: Medium | Effort: S | Risk of fix: Low | Confidence: High

## Context

Two real, hot query patterns in this codebase filter/sort on columns that have no supporting
index in `packages/db/prisma/schema.prisma`. Prisma does not automatically index every
foreign-key column on PostgreSQL the way some ORMs do — each index has to be declared explicitly
in the schema.

## Current state (verbatim)

`packages/db/prisma/schema.prisma:247-276` (`Order` model, full field list + current indexes):
```prisma
model Order {
  id              String      @id @default(uuid())
  shopId          String
  orderNumber     String      @unique
  customerName    String
  customerPhone   String
  customerAddress String?
  customerPostalCode String?
  paymentMethod   String      @default("CARD_TO_CARD")
  items           Json
  totalPrice      BigInt
  discount        BigInt      @default(0)
  couponCode      String?
  status            OrderStatus @default(PENDING)
  paymentStatus     PayStatus   @default(UNPAID)
  paymentRef        String?
  note              String?
  carrier           String?
  trackingCode      String?
  estimatedDelivery DateTime?
  trackingHistory   Json        @default("[]")
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)

  @@index([shopId, status])
  @@index([orderNumber])
  @@index([createdAt])
}
```

`apps/api/src/orders/orders.service.ts:149-165` (`findAllForOwner` — the real, hot query; every
shop-owner's orders dashboard page load hits this, and it's paginated so it runs on every page
turn too):
```ts
  async findAllForOwner(userId: string, page?: number, status?: string) {
    const shop = await this.prisma.shop.findUnique({ where: { userId }, select: { id: true } });
    if (!shop) return { orders: [], total: 0 };

    const safePage = Number(page) > 0 ? Number(page) : 1;
    const where: any = { shopId: shop.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        // ... orderBy createdAt desc, pagination — confirm exact shape when implementing
```
This filters `WHERE shopId = ?` (optionally `AND status = ?`) and sorts by `createdAt DESC` with
pagination. The existing `@@index([shopId, status])` helps the filter but Postgres still has to
sort the matching rows by `createdAt` without an index to do it efficiently once `status` isn't
also filtered (the common case — "all orders" view) or even when it is (the composite index's
second column is `status`, not `createdAt`, so it can't serve the sort for free).

`packages/db/prisma/schema.prisma:319-339` (`Coupon` model, full field list + current index):
```prisma
model Coupon {
  id          String   @id @default(uuid())
  shopId      String?
  code        String   @unique
  type        String   @default("percent")
  value       Int
  maxUses     Int      @default(-1)
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  scopeType     String   @default("ALL")
  scopeId       String?
  scopeName     String?
  scopeCategory String?
  createdAt   DateTime @default(now())

  shop Shop? @relation(fields: [shopId], references: [id], onDelete: SetNull)

  @@index([code])
}
```

`apps/api/src/coupons/coupons.service.ts:42-43` (real query, the shop owner's coupon list page):
```ts
    return this.prisma.coupon.findMany({
      where: { shopId: shop.id },
```
Also used the same way in `apps/api/src/admin/admin.service.ts:356` (admin's cross-shop coupon
view). `Coupon` has **no index at all** on `shopId` — every per-shop coupon list is a full table
scan, which gets worse as total coupon volume across all shops grows (today, with few shops, this
is invisible; it won't stay that way).

## What to do

### Step 1 — Edit the Prisma schema

Edit `packages/db/prisma/schema.prisma`. In the `Order` model, add a composite index:
```prisma
  @@index([shopId, status])
  @@index([orderNumber])
  @@index([createdAt])
  @@index([shopId, createdAt])
```

In the `Coupon` model, add a `shopId` index:
```prisma
  @@index([code])
  @@index([shopId])
```

### Step 2 — Regenerate the Prisma client locally

```bash
pnpm --filter @weelink/db exec prisma generate
```
Then type-check the API (`pnpm --filter @weelink/api exec tsc --noEmit -p tsconfig.json`) to
confirm nothing else needs updating — a new index alone shouldn't produce any type changes, this
is just a sanity check.

### Step 3 — Apply to production via raw SQL (this project has no Prisma migration history — see
`packages/db/prisma/migrations/` doesn't exist; schema changes go to prod via manual SQL over SSH,
same pattern as every other schema change in this project's history)

```sql
CREATE INDEX IF NOT EXISTS "Order_shopId_createdAt_idx" ON "Order"("shopId", "createdAt");
CREATE INDEX IF NOT EXISTS "Coupon_shopId_idx" ON "Coupon"("shopId");
```
These index names follow Prisma's default naming convention (`{Model}_{field1}_{field2}_idx`), so
a future `prisma db push` against this schema will recognize them as already satisfied and not try
to recreate them.

Run via the established pattern: `docker exec <postgres-container> psql -U weelink -d weelink_db -c
"<sql above>"`. Both `CREATE INDEX` statements are additive and non-locking-in-practice for tables
of this project's current size (no `CONCURRENTLY` needed at this scale, but there's no harm in
using `CREATE INDEX CONCURRENTLY` instead if you want zero lock risk — note that `CONCURRENTLY`
cannot run inside a transaction block, so if the SSH execution pattern wraps statements in a
transaction, drop `CONCURRENTLY` or run it as a standalone statement outside any transaction).

## Files in scope

- `packages/db/prisma/schema.prisma` (two `@@index` additions, one per model)
- Production Postgres (two `CREATE INDEX` statements, additive only)

## Explicitly out of scope — do not touch

- Do not add indexes to any other model beyond `Order` and `Coupon` — this plan is scoped to the
  two confirmed-real hot-query gaps found during the audit, not a speculative full-schema index
  review.
- Do not remove or modify any existing index (`@@index([shopId, status])`, `@@index([orderNumber])`,
  `@@index([createdAt])` on `Order`; `@@index([code])` on `Coupon`) — all stay as-is, this is purely
  additive.
- Do not create a formal Prisma migration file / retrofit migration history as part of this plan —
  that's a separate, larger, explicitly-deferred piece of work from the original audit.

## Verification

1. `pnpm --filter @weelink/db exec prisma generate` — must succeed with no errors.
2. `pnpm --filter @weelink/api exec tsc --noEmit -p tsconfig.json` — must compile clean.
3. After applying the SQL to production, confirm both indexes exist:
   `docker exec <postgres-container> psql -U weelink -d weelink_db -c '\d "Order"'` and
   `\d "Coupon"` — both should list the new index under "Indexes:".
4. `EXPLAIN ANALYZE` the real query from `orders.service.ts` (`SELECT * FROM "Order" WHERE
   "shopId" = '<a-real-shop-id>' ORDER BY "createdAt" DESC LIMIT 20`) before and after — confirm
   the query plan switches from a sequential scan + sort to an index scan using the new composite
   index (or at least confirm the "sort" step disappears from the plan, since the index now serves
   the ORDER BY directly).
5. Confirm application behavior is unchanged — orders dashboard and coupon list pages should return
   identical data, just faster under load. No functional test needed beyond a manual page load.

## Maintenance note

Any future new query pattern that filters by `shopId` alongside a sort/range column (e.g. a future
per-shop dashboard feature) should get the same `[shopId, <sort column>]` composite-index treatment
proactively rather than waiting for it to show up as a slow-query finding later.
