# 015 — Add `priority` to the bio page's avatar/banner images (LCP)

Status: TODO
Written against commit: `74e98a3`
Category: Performance (Core Web Vitals) | Impact: High | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/web/src/app/[slug]/BioPageClient.tsx` renders the shop's banner and avatar using
`next/image`. Neither has the `priority` prop set, so Next.js applies its default behavior:
`loading="lazy"` and no `<link rel="preload">` hint in the document head. On the bio page — the
single highest-traffic, most latency-sensitive page in this product, since visitors land here
directly from an Instagram bio link — the avatar (and banner, when present) is almost always the
Largest Contentful Paint element: it's large, centered, and above the fold. Lazy-loading the LCP
element measurably delays LCP, one of Google's three Core Web Vitals that also factor into search
ranking.

## Current state (verbatim)

`apps/web/src/app/[slug]/BioPageClient.tsx:120-123` (banner):
```tsx
      {shop.bannerUrl && (
        <div className="w-full max-w-lg h-36 relative overflow-hidden">
          <Image src={shop.bannerUrl} alt="" fill sizes="512px" className="object-cover" />
        </div>
      )}
```

`apps/web/src/app/[slug]/BioPageClient.tsx:133-136` (avatar):
```tsx
            {shop.avatarUrl ? (
              <Image src={shop.avatarUrl} alt={shop.name} fill sizes="80px" className="object-cover" />
            ) : (
```

Both are `next/image` with the `fill` prop already — just missing `priority`.

## What to do

Add `priority` to both `Image` components. The avatar is the more consistently-present,
consistently-above-the-fold element (banner is optional and shorter), so it should always get
`priority`; the banner should too when present, since it renders even higher on the page than the
avatar (visually first).

Edit `apps/web/src/app/[slug]/BioPageClient.tsx`:

```tsx
      {shop.bannerUrl && (
        <div className="w-full max-w-lg h-36 relative overflow-hidden">
          <Image src={shop.bannerUrl} alt="" fill sizes="512px" className="object-cover" priority />
        </div>
      )}
```

```tsx
            {shop.avatarUrl ? (
              <Image src={shop.avatarUrl} alt={shop.name} fill sizes="80px" className="object-cover" priority />
            ) : (
```

Next.js only allows a small number of `priority` images per page without triggering a build/dev
warning about "too many priority images" hurting performance — with just these two (and neither
always both present simultaneously in the same render in a way that matters, since one is optional)
this stays well within reason. Do not add `priority` to any other image on this page (e.g. images
rendered inside `BlockRenderer` further down the page, which are correctly below-the-fold and
should stay lazy).

## Files in scope

- `apps/web/src/app/[slug]/BioPageClient.tsx` (the two `Image` components only — add one prop each)

## Explicitly out of scope — do not touch

- Do not add `priority` to images inside `BlockRenderer.tsx` or any other component — those render
  further down the page and lazy-loading them is correct, not a bug.
- Do not touch the `sizes` values or switch `fill` to fixed `width`/`height` — those are unrelated
  to this finding and already correctly configured for responsive rendering.
- Do not touch the CLS-related `ImageBlock` finding (raw `<img>` with no reserved aspect ratio in
  `BlockRenderer.tsx`) — that's a separate, unselected finding from the same audit; don't scope-creep
  into fixing it here.

## Verification

1. `pnpm --filter @weelink/web build` — must compile with no errors or new warnings about excessive
   `priority` images.
2. Load a real bio page with a banner and avatar set, view page source (or DevTools → Elements →
   `<head>`) and confirm a `<link rel="preload" as="image" href="...">` now appears for both image
   URLs — this is the concrete signal that `priority` took effect.
3. In Chrome DevTools → Lighthouse (or PageSpeed Insights against the live URL post-deploy), run a
   performance audit before/after and confirm the reported LCP element is the avatar/banner and that
   its load timing improved. This is directional confirmation, not a strict pass/fail gate — Lighthouse
   scores vary run to run.
4. Confirm visually that nothing else changed — the page should look identical, just load the
   avatar/banner sooner.

## Maintenance note

If a future redesign moves the LCP element (e.g. a large hero image added above the avatar), that
new element should get `priority` instead, not in addition — Next.js's guidance is to mark only the
actual LCP candidate(s), not every visible image, since marking too many defeats the purpose
(each `priority` image is fetched at high fetch-priority, competing for the same limited early
bandwidth).
