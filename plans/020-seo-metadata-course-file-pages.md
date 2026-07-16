# 020 — Add server-side SEO metadata to courses/files public pages

Status: TODO
Written against commit: `74e98a3`
Category: SEO | Impact: High | Effort: M | Risk of fix: Low | Confidence: High

## Context

This project already has the *correct* pattern implemented for one storefront page —
`apps/web/src/app/[slug]/shop/page.tsx` is a Server Component with `generateMetadata`, fetches data
server-side, and delegates rendering to a Client Component (`ShopClient.tsx`) for interactivity.
Three sibling pages never got the same treatment and are fully client-only with **no**
`generateMetadata` at all:

- `apps/web/src/app/[slug]/courses/page.tsx` — course listing
- `apps/web/src/app/[slug]/course/[id]/page.tsx` — single course detail (the highest-value page to
  fix, since it's the one a customer might actually share a direct link to)
- `apps/web/src/app/[slug]/files/page.tsx` — digital file listing

Every visit to any of these pages currently falls back to the root layout's generic title/
description (`apps/web/src/app/layout.tsx:7-10`: "ویلینک | یک لینک، همه چیز") instead of a
per-course or per-file title — meaning none of them can rank individually in search results, and
shared links show the wrong preview title/description in Telegram/WhatsApp/Instagram link
previews (which read Open Graph tags, also only available via `generateMetadata`).

## Reference pattern already in this codebase (verbatim, `apps/web/src/app/[slug]/shop/page.tsx`,
full file)

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getShopData(slug: string) {
  try {
    const [shopRes, productsRes] = await Promise.all([
      fetch(`${API}/api/v1/shops/${slug}`, { next: { revalidate: 60 } }),
      fetch(`${API}/api/v1/shops/${slug}/products`, { next: { revalidate: 60 } }),
    ]);
    if (!shopRes.ok) return null;
    return {
      shop: await shopRes.json(),
      products: productsRes.ok ? await productsRes.json() : [],
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getShopData(params.slug);
  if (!data) return { title: "فروشگاه یافت نشد" };
  const { shop } = data;
  return {
    title: `فروشگاه ${shop.data?.name || shop.name}`,
    description: shop.data?.bio || shop.bio,
  };
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const data = await getShopData(params.slug);
  if (!data) notFound();
  const shop = data.shop.data || data.shop;
  const products = Array.isArray(data.products.data) ? data.products.data : data.products;
  return <ShopClient shop={shop} products={products} slug={params.slug} />;
}
```

This exact pattern — server wrapper fetches + `generateMetadata`, delegates to a Client Component
for interactivity — is what the three target pages below need to be converted to.

## Current state of the pages to fix

`apps/web/src/app/[slug]/courses/page.tsx:1-20` (fully client, no metadata, full file structure —
already single-file, needs splitting):
```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Loader2, PlayCircle, Lock, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Course {
  id: string; title: string; description?: string; coverUrl?: string; price: string; isFree: boolean;
  chapters?: { id: string; title: string; videoUrl?: string }[];
}

export default function PublicCoursesPage() {
  const slug = useParams().slug as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/courses`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/api/v1/shops/${slug}`).then((r) => r.json()).catch(() => null),
    ]).then(([c, s]) => {
      setCourses((c?.data ?? c ?? []) as Course[]);
      setShop(s?.data ?? s);
      setLoading(false);
    });
  }, [slug]);
  // ...rest of the component (rendering, unchanged)
```

`apps/web/src/app/[slug]/course/[id]/page.tsx:1-14` and `apps/web/src/app/[slug]/files/page.tsx:1-15`
follow the identical shape (`"use client"`, `useParams`, client-side `useEffect` fetch, no
metadata) — read each file in full before starting; each has its own specific fetch calls and
interactive logic (the course detail page in particular has license-login/secure-video-player
logic that must be preserved exactly, not simplified).

## What to do

For **each** of the three target pages, apply the same split used in `[slug]/shop/`:

### Step 1 — Move the existing client component aside

Rename the file's content into a sibling client component (matching `ShopClient.tsx`'s naming
convention):
- `apps/web/src/app/[slug]/courses/page.tsx` → move its content to
  `apps/web/src/app/[slug]/courses/CoursesClient.tsx`, changing `export default function
  PublicCoursesPage(` to `export default function CoursesClient({ slug, initialCourses, shop
  }: { slug: string; initialCourses: Course[]; shop: any })`. Keep everything else (all hooks,
  rendering, interactivity) unchanged — only remove the `useParams()` call and the fetch
  `useEffect`, since the data now arrives as props from the server wrapper instead. Seed local
  state from the props (e.g. `useState(initialCourses)` instead of `useState([])`, if the component
  needs local mutation of the list — check the actual current logic before assuming).
- `apps/web/src/app/[slug]/course/[id]/page.tsx` → move to
  `apps/web/src/app/[slug]/course/[id]/CourseDetailClient.tsx`. This page has significantly more
  client-side logic (license/access-token handling, secure video player) — **read the entire
  current file first**, and be careful to preserve every piece of it; only the top-level
  `useParams()`-driven initial fetch of the course's public metadata (title/description/cover)
  should move server-side, not the license/playback logic, which must stay client-side exactly as
  it is (it depends on `localStorage`/user interaction and cannot run on the server).
- `apps/web/src/app/[slug]/files/page.tsx` → move to
  `apps/web/src/app/[slug]/files/FilesClient.tsx`, same pattern as courses.

### Step 2 — Create the new `page.tsx` server wrapper for each

For `apps/web/src/app/[slug]/courses/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CoursesClient from "./CoursesClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getData(slug: string) {
  try {
    const [coursesRes, shopRes] = await Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/courses`, { next: { revalidate: 60 } }),
      fetch(`${API}/api/v1/shops/${slug}`, { next: { revalidate: 60 } }),
    ]);
    if (!shopRes.ok) return null;
    return {
      courses: coursesRes.ok ? await coursesRes.json() : [],
      shop: await shopRes.json(),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getData(params.slug);
  if (!data) return { title: "فروشگاه یافت نشد" };
  const shop = data.shop.data || data.shop;
  return {
    title: `دوره‌های آموزشی ${shop.name}`,
    description: shop.bio || `دوره‌های آموزشی ${shop.name} در ویلینک`,
  };
}

export default async function CoursesPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const courses = Array.isArray(data.courses.data) ? data.courses.data : data.courses;
  const shop = data.shop.data || data.shop;
  return <CoursesClient slug={params.slug} initialCourses={courses} shop={shop} />;
}
```

Apply the equivalent pattern to `course/[id]/page.tsx` (metadata should use the **specific course's**
title/description/cover — fetch the single course by id, not the list; check the existing client
code for which endpoint it calls for a single course, e.g. likely
`GET /shops/:slug/courses/:id` or filtering the list — read the current file to find the exact
endpoint before assuming) and `files/page.tsx` (mirroring `courses/page.tsx` almost exactly, just
for `DigitalFile` instead of `Course`).

### Step 3 — Add Open Graph + JSON-LD for the course/file detail pages specifically

For `course/[id]/page.tsx`'s `generateMetadata`, also add `openGraph` (matching the pattern already
used in `[slug]/page.tsx:38-46` for the bio page) so shared links preview correctly:
```tsx
  return {
    title: course.title,
    description: course.description || `دوره ${course.title}`,
    openGraph: {
      title: course.title,
      description: course.description,
      images: course.coverUrl ? [{ url: course.coverUrl }] : [],
    },
  };
```
Optionally add `Course` JSON-LD structured data (schema.org) in the page body, mirroring how
`[slug]/page.tsx:61-79` embeds `ProfilePage` JSON-LD via a `<script type="application/ld+json">`
tag — this is a nice-to-have for rich search results, not required for the core fix; do it if
straightforward, skip if it adds meaningful complexity given the course data shape.

## Files in scope

- `apps/web/src/app/[slug]/courses/page.tsx` (rewritten as server wrapper)
- `apps/web/src/app/[slug]/courses/CoursesClient.tsx` (new — moved client content)
- `apps/web/src/app/[slug]/course/[id]/page.tsx` (rewritten as server wrapper)
- `apps/web/src/app/[slug]/course/[id]/CourseDetailClient.tsx` (new — moved client content)
- `apps/web/src/app/[slug]/files/page.tsx` (rewritten as server wrapper)
- `apps/web/src/app/[slug]/files/FilesClient.tsx` (new — moved client content)

## Explicitly out of scope — do not touch

- `apps/web/src/app/[slug]/shop/page.tsx` / `ShopClient.tsx` — already correct, this is the
  reference pattern, not a target.
- Do not change any interactive behavior, purchase flow, license/access logic, or video player
  logic in any of the three client components being split out — this plan is a structural
  metadata-enablement change only. If you find yourself rewriting business logic to "make the split
  cleaner," stop — preserve the existing logic exactly, just relocate it.
- Do not add `generateMetadata` to `apps/web/src/app/[slug]/booking/page.tsx` or any other public
  page not listed above — out of scope for this plan (a future pass can extend the same pattern
  there if wanted).

## Verification

1. `pnpm --filter @weelink/web build` — must compile with no errors for all three converted routes.
2. For each of the three pages, load a real live URL (e.g. `/somerealshop/courses`,
   `/somerealshop/course/<real-id>`, `/somerealshop/files`) and confirm:
   - The page renders identically to before (same data, same interactivity) — this is a structural
     change, not a visual/functional one.
   - View source / DevTools confirms a per-page `<title>` and `<meta name="description">` now
     appear (not the generic root layout ones).
3. For `course/[id]/page.tsx` specifically: confirm the license-login flow and secure video
   playback still work exactly as before — this is the highest-risk file to regress since it has
   the most client-side state; test purchasing/accessing a real course end-to-end if at all
   possible, not just a visual check.
4. Test the `notFound()` path — visit a nonexistent slug or course id and confirm Next.js's 404
   page renders (not a client-side error or blank page), for all three routes.
5. Share a course-detail link in a tool that previews Open Graph tags (or inspect the meta tags
   directly) and confirm the title/description/image now reflect the specific course, not the
   generic site default.

## Maintenance note

Any future new public storefront page (e.g. if a "gift cards" or similar public listing page is
added later) should be built directly in this server-wrapper + client-component pattern from the
start, rather than as a client-only page needing this same retrofit later.
