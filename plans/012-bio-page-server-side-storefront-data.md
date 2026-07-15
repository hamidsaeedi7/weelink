# 012 — Fold bio-page client-side fetch waterfall into the server-side shop payload

Status: TODO
Written against commit: `6afe742`
Category: Performance | Impact: High | Effort: M | Risk of fix: Low | Confidence: High

## Context

`apps/web/src/app/[slug]/page.tsx` is a Next.js Server Component that already fetches the shop's
full data server-side (with 60s ISR) before rendering. It passes that data into
`BioPageClient.tsx`, a **Client Component** (`"use client"`) which then, on mount, independently
fires 5 more `fetch` calls from the browser to determine which storefront links to show
(products/files/courses/appointments counts) and which flash sales are active. This means every
single bio-page visitor's browser does 5 extra network round-trips to the API *after* the page has
already loaded, purely to answer questions the server already had the data to answer in its
original request.

## Current state (verbatim)

`apps/web/src/app/[slug]/page.tsx:9-21` (server-side fetch, already happens today):
```ts
async function getShop(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/shops/${slug}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}
```

`apps/web/src/app/[slug]/BioPageClient.tsx:14-26` (client-side waterfall #1 — counts):
```tsx
function StorefrontLinks({ slug, primary }: { slug: string; primary: string }) {
  const [state, setState] = useState({ products: 0, files: 0, courses: 0, services: 0 });
  useEffect(() => {
    (async () => {
      const [p, f, c, a] = await Promise.all([
        fetch(`${API}/api/v1/shops/${slug}/products`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/api/v1/shops/${slug}/digital-files`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/api/v1/shops/${slug}/courses`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/api/v1/shops/${slug}/appointments/services`).then((r) => r.json()).catch(() => []),
      ]);
      setState({ products: unwrap(p).length, files: unwrap(f).length, courses: unwrap(c).length, services: unwrap(a).length });
    })();
  }, [slug]);
  // ...renders one link per non-zero count
```

`apps/web/src/app/[slug]/BioPageClient.tsx:53-57` (client-side waterfall #2 — flash sales):
```tsx
function FlashSaleStrip({ slug, primary }: { slug: string; primary: string }) {
  const [sales, setSales] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API}/api/v1/flash-sales/public/${slug}`).then((r) => r.json()).then((d) => setSales(unwrap(d))).catch(() => {});
  }, [slug]);
  // ...renders active (non-expired) sales with a live countdown
```

Backend source for the equivalent data:
- `apps/api/src/shops/shops.service.ts:31-55` — `findBySlug`, the method backing
  `GET /api/v1/shops/:slug` (the one `page.tsx` already calls server-side).
- `apps/api/src/flash-sales/flash-sales.service.ts:84-93` — `getPublic(slug)`:
  ```ts
  async getPublic(slug: string) {
    const shop = await this.prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop) throw new NotFoundException("فروشگاه یافت نشد");
    const now = new Date();
    const sales = await this.prisma.flashSale.findMany({
      where: { shopId: shop.id, isActive: true, endsAt: { gt: now } },
      orderBy: { endsAt: "asc" },
    });
    return sales.map(this.serialize);
  }
  ```
- Prisma models involved (`packages/db/prisma/schema.prisma`): `Product` (line 220), `DigitalFile`
  (line 593), `Course` (line 636), `AppointmentService` (line 718), `FlashSale` (line 840).

## Why this matters

The bio page is this product's single highest-traffic, most latency-sensitive surface — the whole
point of a bio-link product is that it loads fast when someone taps a link in an Instagram bio.
Every extra client-side round-trip after hydration delays when the storefront links / flash-sale
strip become visible (visible layout shift as they pop in late) and multiplies API load per
pageview for data the server already had.

## What to do

### Step 1 — Confirm the exact filter each existing public list endpoint uses

Before writing count queries, read the actual public list endpoints currently powering the 4 count
fetches (`GET /shops/:slug/products`, `/shops/:slug/digital-files`, `/shops/:slug/courses`,
`/shops/:slug/appointments/services` — find their controllers/services under
`apps/api/src/products`, `apps/api/src/digital-files`, `apps/api/src/courses`,
`apps/api/src/appointments`). Note the exact `where` clause each uses (e.g. do they filter
`isActive: true`? any other visibility flag?). **The new count queries in Step 2 must use the
identical filter**, or the storefront link badge could show "3 products" while the actual products
page shows 0 (a real regression risk if you guess instead of checking).

### Step 2 — Extend `ShopsService.findBySlug` to include storefront counts and active flash sales

Edit `apps/api/src/shops/shops.service.ts`. If plan 011 (Redis caching for this same method) has
already been applied to this file, add the new queries to the same `Promise.all`/data-gathering
step that happens *before* the `redis.set(...)` cache write, so the new fields get cached
automatically as part of the existing cached payload — do not add a second, separate cache entry.
If plan 011 has not been applied yet, just add the queries directly inside `findBySlug` as shown
below.

Add these queries (matching the filters confirmed in Step 1 — the example below assumes
`isActive: true` is the right filter for each, adjust per what you actually find):

```ts
    const [productsCount, filesCount, coursesCount, servicesCount, activeFlashSales] = await Promise.all([
      this.prisma.product.count({ where: { shopId: shop.id, isActive: true } }),
      this.prisma.digitalFile.count({ where: { shopId: shop.id, isActive: true } }),
      this.prisma.course.count({ where: { shopId: shop.id, isActive: true } }),
      this.prisma.appointmentService.count({ where: { shopId: shop.id, isActive: true } }),
      this.prisma.flashSale.findMany({
        where: { shopId: shop.id, isActive: true, endsAt: { gt: new Date() } },
        orderBy: { endsAt: "asc" },
      }),
    ]);
```

Add the results to the returned object:
```ts
    return {
      ...rest,
      ownerPlan: user?.plan ?? "FREE",
      cardNumber: activeCard?.cardNumber ?? null,
      cardHolder: activeCard?.cardHolder ?? null,
      bankName: activeCard?.bankName ?? null,
      storefrontCounts: {
        products: productsCount,
        files: filesCount,
        courses: coursesCount,
        services: servicesCount,
      },
      activeFlashSales, // same shape FlashSalesService.getPublic already returns — check its `serialize` method and match field names exactly
    };
```

Check `FlashSalesService`'s private `serialize` method (referenced in `getPublic`, around
`flash-sales.service.ts`) for exactly how it transforms each `FlashSale` row (e.g. `BigInt` price
fields likely get converted to numbers/strings for JSON safety) — replicate the same
transformation on `activeFlashSales` in `ShopsService`, since raw Prisma `BigInt` fields
(`originalPrice`/`salePrice`, per the schema excerpt above) will throw when `JSON.stringify`'d
(relevant both for the HTTP response and for plan 011's `JSON.stringify` cache write) unless
converted first.

### Step 3 — Update `BioPageClient.tsx` to consume the new fields instead of fetching

Edit `apps/web/src/app/[slug]/BioPageClient.tsx`:

1. Extend the `Shop` interface (currently `interface Shop { ... }`) to include:
   ```ts
   storefrontCounts?: { products: number; files: number; courses: number; services: number };
   activeFlashSales?: any[];
   ```

2. Change `StorefrontLinks` to take the counts as a prop instead of fetching:
   ```tsx
   function StorefrontLinks({ slug, primary, counts }: { slug: string; primary: string; counts: { products: number; files: number; courses: number; services: number } }) {
     const links = [
       counts.products > 0 && { href: `/${slug}/shop`, icon: ShoppingBag, label: "فروشگاه محصولات" },
       counts.files > 0 && { href: `/${slug}/files`, icon: FileDown, label: "فایل‌های دیجیتال" },
       counts.courses > 0 && { href: `/${slug}/courses`, icon: BookOpen, label: "دوره‌های آموزشی" },
       counts.services > 0 && { href: `/${slug}/booking`, icon: CalendarCheck, label: "رزرو نوبت آنلاین" },
     ].filter(Boolean) as { href: string; icon: any; label: string }[];

     if (!links.length) return null;
     return (
       <div className="space-y-2.5 mb-3">
         {links.map((l) => (
           <a key={l.href} href={l.href}
             className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10
                        hover:bg-white/10 transition-all active:scale-[0.98]"
             style={{ borderColor: `${primary}30` }}>
             <l.icon className="w-5 h-5 shrink-0" style={{ color: primary }} />
             <span className="flex-1 text-sm font-medium text-white">{l.label}</span>
             <ExternalLink className="w-4 h-4 text-white/30 shrink-0" />
           </a>
         ))}
       </div>
     );
   }
   ```
   Remove the `useState`/`useEffect`/`unwrap` usage from this function entirely — no more fetch.

3. Change `FlashSaleStrip` to take sales as a prop instead of fetching:
   ```tsx
   function FlashSaleStrip({ sales, primary }: { sales: any[]; primary: string }) {
     const active = sales.filter((s) => s.isActive !== false && new Date(s.endsAt) > new Date());
     if (!active.length) return null;
     return (
       <div className="space-y-2.5 mb-3">
         {active.map((s) => <FlashCard key={s.id} sale={s} primary={primary} />)}
       </div>
     );
   }
   ```
   `FlashCard` itself (the per-second countdown timer component) is unchanged — it already receives
   `sale` as a prop and its `setInterval` tick is a legitimate client-side concern (a live
   countdown), not a data-fetching one. Leave it exactly as-is.
   Remove the `useState`/`useEffect` fetch from `FlashSaleStrip`; the re-filter of `s.isActive !==
   false && new Date(s.endsAt) > new Date()` stays as a defensive client-side re-check (data can go
   stale between the server render and the visitor's click, especially given the shop payload may
   be cached — see plan 011 — or ISR-cached for up to 60s per `page.tsx`'s `revalidate: 60`).

4. Update the call sites inside `BioPageClient` (around line 175-176):
   ```tsx
   <FlashSaleStrip sales={shop.activeFlashSales || []} primary={primary} />
   <StorefrontLinks slug={shop.slug} primary={primary} counts={shop.storefrontCounts || { products: 0, files: 0, courses: 0, services: 0 }} />
   ```

5. Remove the now-unused `const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";`
   (line 9) and the `unwrap` helper (line 11) **only if** nothing else in this file still uses them
   after the above changes — grep the file for `API` and `unwrap` before deleting either.

## Files in scope

- `apps/api/src/shops/shops.service.ts` (`findBySlug` — add the 5 new parallel queries and 2 new
  response fields)
- `apps/web/src/app/[slug]/BioPageClient.tsx` (`StorefrontLinks`, `FlashSaleStrip`, the `Shop`
  interface, and the two call sites)

## Explicitly out of scope — do not touch

- `FlashCard` — unchanged, still a client-side countdown timer component, still takes `sale` as a
  prop exactly as it does today.
- `apps/web/src/app/[slug]/page.tsx` — no changes needed; it already fetches the shop object and
  passes it to `BioPageClient` as-is, the new fields just ride along inside the existing payload.
- The dedicated pages this links to (`/${slug}/shop`, `/${slug}/files`, `/${slug}/courses`,
  `/${slug}/booking`) — those still do their own full data fetches when visited; this plan only
  removes the *count-only* pre-fetch used to decide whether to show the link at all.
- `apps/api/src/flash-sales/flash-sales.controller.ts`'s `GET public/:slug` route — leave it as-is;
  other consumers (if any — check `grep -rn "flash-sales/public" apps/web/src apps/admin/src` before
  assuming it's now fully unused) may still call it directly, and removing a public API route is a
  bigger decision than this plan's scope.

## Verification

1. `pnpm --filter @weelink/api build` and `pnpm --filter @weelink/web build` — both must compile
   with no TypeScript errors (pay attention to the `BigInt` serialization issue flagged in Step 2 —
   a `BigInt` field reaching `JSON.stringify` anywhere in the response pipeline throws at runtime,
   not compile time, so this needs a real runtime check, not just `tsc --noEmit`).
2. Start both API and web locally. Load a real bio page for a shop that has at least one product,
   one digital file, and one active flash sale. Open browser DevTools → Network tab, hard refresh.
   Expected: **zero** requests to `/products`, `/digital-files`, `/courses`,
   `/appointments/services`, or `/flash-sales/public/*` after the initial page load — only the one
   server-rendered page load (Next.js server-side fetch doesn't appear in the browser's Network
   tab at all, confirming it truly moved server-side).
3. Confirm the storefront links (شop/files/courses/booking) still appear/disappear correctly based
   on whether that shop actually has 1+ items of each type — test against a shop with zero products
   (link should NOT appear) and a shop with some (link SHOULD appear).
4. Confirm the flash-sale strip still renders with a live, correctly-ticking countdown for an
   active sale, and does NOT render for a shop with no active sales or only expired ones.
5. Let a flash sale's `endsAt` pass while the page is open (or fake the system clock / use a sale
   ending in ~10 seconds for this test) — confirm the client-side re-filter in `FlashSaleStrip`
   still correctly hides it once expired, without needing a page reload.

## Maintenance note

If a future storefront section is added (e.g. a "gift cards" feature) that needs the same
show-link-if-count-&gt;0 pattern, extend `storefrontCounts` and the `Promise.all` in `findBySlug`
rather than reintroducing a new client-side fetch — that's the whole point of this fix, and it's
easy to accidentally regress by adding a new client `useEffect` fetch out of habit.
