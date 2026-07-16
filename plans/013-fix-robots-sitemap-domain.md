# 013 — Fix robots.txt sitemap domain mismatch

Status: TODO
Written against commit: `74e98a3`
Category: SEO | Impact: High | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/web/src/app/robots.ts` (Next.js's `MetadataRoute.Robots` convention, generates `/robots.txt`)
points its `sitemap` field at `https://weeelink.com/sitemap.xml`, but every other canonical/OG
reference in this codebase — including the actual sitemap generator itself — uses
`https://weeelink.ir`. `weeelink.com` is not this product's domain. Search engines read
`robots.txt`'s `sitemap:` directive as the primary way to discover a site's sitemap without it
being manually submitted in Search Console; a wrong domain there means the sitemap may never be
crawled via this path.

## Current state (verbatim)

`apps/web/src/app/robots.ts` (full file):
```ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/payment/", "/onboarding"],
      },
    ],
    sitemap: "https://weeelink.com/sitemap.xml",
  };
}
```

`apps/web/src/app/sitemap.ts:4` (the actual sitemap, correct domain):
```ts
const SITE = "https://weeelink.ir";
```

`apps/web/src/app/[slug]/page.tsx:23` (bio-page canonical URL, also correct domain):
```ts
const SITE_URL = "https://weeelink.ir";
```

## What to do

Edit `apps/web/src/app/robots.ts`, fix the domain:

```ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/payment/", "/onboarding"],
      },
    ],
    sitemap: "https://weeelink.ir/sitemap.xml",
  };
}
```

That is the entire fix — a one-line domain correction.

## Files in scope

- `apps/web/src/app/robots.ts` (the `sitemap` field only)

## Explicitly out of scope — do not touch

- `apps/web/src/app/sitemap.ts` — already correct, no changes needed.
- The `disallow` rules — not part of this finding; don't add/remove paths here unless asked.

## Verification

1. `pnpm --filter @weelink/web build` — must compile with no errors (this route is statically
   generated at build time).
2. After deploying, `curl https://weeelink.ir/robots.txt` and confirm the `Sitemap:` line reads
   `https://weeelink.ir/sitemap.xml`, not `.com`.
3. Optionally, once live, submit/re-check in Google Search Console that the sitemap is discovered
   (this step is informational, not blocking — the code fix itself is what this plan verifies).

## Maintenance note

If this project ever needs a second domain (e.g. a rebrand), grep for the literal string
`"https://weeelink.ir"` across `apps/web/src` first — it's hardcoded in at least 3 places
(`robots.ts`, `sitemap.ts`, `[slug]/page.tsx`) rather than centralized in one constant/env var.
Consider centralizing it into a shared constant as part of that future work, not as part of this
plan.
