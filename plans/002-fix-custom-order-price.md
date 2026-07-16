# 002 — Fix client-controlled price on custom checkout line items

Status: DONE — executed and live-verified in production
Written against commit: `6afe742`
Category: Money / Input validation | Impact: Medium-High | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/api/src/orders/orders.service.ts` handles checkout order creation for the public,
**unauthenticated** `POST /orders` endpoint (bio-page visitors buying products). The service
computes the order total server-side from the real `Product` price for known products, but for
any cart item whose `productId` doesn't match a real product row (the "custom item" pattern used
for manual/negotiated items), it falls back to whatever price the client submitted in the request
body — with no upper bound.

## Current state (verbatim, `apps/api/src/orders/orders.service.ts:47-52`)

```ts
    // Server-side authoritative price for real products (never trust client-submitted price).
    const totalPrice = dto.items.reduce((s, i) => {
      const p = productMap.get(i.productId);
      const price = p ? Number(p.price) : i.price;
      return s + price * i.qty;
    }, 0);
```

`productMap` is built earlier in the same function from `products` — the result of a Prisma query
scoped to the shop's real products. When `p` is `undefined` (no matching real product — i.e. a
"custom" line item), `price` falls back to `i.price`, which is the raw client-submitted value.

The DTO that validates `i.price` — `apps/api/src/orders/dto/create-order.dto.ts:4-18`:
```ts
export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  qty: number;
}
```

`@Min(0)` is the only constraint — no upper bound, and nothing ties `price` to a value the server
can independently verify for the `productId: "custom"` case.

## Why this matters

The comment on line 47 (`"never trust client-submitted price"`) states the intended invariant,
but the code one line below violates it for any item without a matching `productId`. The intended
UI flow (`apps/web/src/app/[slug]/order/page.tsx`) always sends `price: 0` for custom items and
routes them through manual `CARD_TO_CARD` payment (a human reviews before confirming via
`markPaid`), which limits real-world impact today — but `POST /orders` is a public API with no
auth, so anyone calling it directly (bypassing the web UI entirely) can set `totalPrice` to
whatever they want by naming any non-existent `productId` in their request. This affects revenue
reporting (`Order.totalPrice` feeds `apps/api/src/analytics/analytics.service.ts`'s revenue sum)
and, if a shop owner's manual-review discipline lapses, actual money collected.

## What to do

Force the server-computed price to `0` for any item that doesn't resolve to a real product,
**regardless of what the client sends** — matching what the intended UI already does, but
enforcing it server-side so the API can't be used to inject an arbitrary total.

Edit `apps/api/src/orders/orders.service.ts`, replacing lines 47-52:

```ts
    // Server-side authoritative price. Real products always use the DB price.
    // "Custom" items (no matching productId) are always priced 0 here — the seller
    // sets/confirms the real price manually during CARD_TO_CARD review (see markPaid).
    // Never trust a client-submitted price for either case.
    const totalPrice = dto.items.reduce((s, i) => {
      const p = productMap.get(i.productId);
      const price = p ? Number(p.price) : 0;
      return s + price * i.qty;
    }, 0);
```

This is the only functional change needed. Do not add a separate "custom item" code path, a new
DTO field, or a max-price cap — zeroing the fallback is the minimal, correct fix that restores the
comment's stated invariant.

### Check for a second call site

`grep -n "i.price\|item.price" apps/api/src/orders/orders.service.ts` to confirm there is no other
place in the same file computing a price from `dto.items` (e.g. a duplicate calculation in an
`update` or `recalculate` method) that has the same bug and needs the identical fix. If one exists,
apply the same change there and note it in this plan's "Deviations" section when you report back.

## Files in scope

- `apps/api/src/orders/orders.service.ts` (the `totalPrice` reduce only)

## Explicitly out of scope — do not touch

- `apps/api/src/orders/dto/create-order.dto.ts` — no DTO changes needed; this is a service-layer
  fix, not a validation-layer one.
- `apps/web/src/app/[slug]/order/page.tsx` — the frontend already sends `price: 0` for custom
  items; it is not part of the bug and needs no change.
- Do not add authentication to `POST /orders` — it's intentionally public (anonymous checkout is
  the product's design), that's not what this plan is fixing.
- Do not touch the `couponCode` discount logic below this block (`orders.service.ts:53+`).

## Verification

1. `pnpm --filter @weelink/api build` (or `tsc --noEmit` if available) — must compile with no
   errors.
2. Manual API test against a local/dev instance (not production): `POST /api/v1/orders` with a
   body containing one item whose `productId` is a random non-existent string (e.g.
   `"custom-test-123"`) and `price: 999999`. Expected: the created order's `totalPrice` in the
   response is `0` (or reflects only any other real items in the same cart), NOT `999999`.
3. `POST /api/v1/orders` with a real, existing `productId` and a tampered `price` in the request
   body (e.g. actual product price is 50000, client sends `price: 1`). Expected: `totalPrice`
   reflects the real DB price (50000 × qty), confirming the existing real-product path still works
   correctly and was not broken by this change.
4. Re-run the existing checkout flow end-to-end through the web UI (`apps/web/src/app/[slug]/order`)
   for a real product purchase — confirm order total and confirmation page still show the correct
   amount.

## Maintenance note

If a future feature legitimately needs seller-set custom pricing at checkout time (e.g. a "make an
offer" flow), it must be built as an explicit, separately-validated field — not by resurrecting a
client-trusted `price` fallback on the generic items array.
