# 017 — Add `noindex` metadata fallback to the dashboard

Status: TODO
Written against commit: `74e98a3`
Category: SEO | Impact: Medium | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/web/src/app/robots.ts` already lists `/dashboard/` in its `disallow` rules, but a
`robots.txt` disallow is a *request*, not an enforcement — it doesn't prevent a search engine from
indexing a URL it discovered another way (an inbound link, a browser-submitted URL, etc.); it just
asks crawlers not to fetch it. Google in particular is known to still index a disallowed URL as a
bare "no information is available" listing if it finds a link to it elsewhere. The robust way to
keep a page out of search results is a `noindex` directive delivered *on the page itself*
(meta tag or `X-Robots-Tag` header), which this project has nowhere for any `/dashboard/*` route.

## Current state

`apps/web/src/app/dashboard/layout.tsx:1,156` (confirmed via direct read — the file is a **Client
Component**, which means it cannot itself `export const metadata` — Next.js requires metadata
exports to live in a Server Component):
```tsx
"use client";
// ... 155 lines of imports, hooks, and JSX ...
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
```

`apps/web/src/app/robots.ts:9` (the existing, non-enforcing protection):
```ts
        disallow: ["/dashboard/", "/api/", "/payment/", "/onboarding"],
```

## What to do

Since `dashboard/layout.tsx` must stay a Client Component (it uses `usePathname`, `useState`,
`useEffect`, `useTheme` throughout), the correct Next.js App Router pattern is to split it: rename
the existing file's content into a client-only shell component, and make `layout.tsx` itself a thin
Server Component that exports `metadata` and renders the shell.

### Step 1 — Rename the existing client component

Rename `apps/web/src/app/dashboard/layout.tsx` to `apps/web/src/app/dashboard/DashboardShell.tsx`,
keeping its content byte-for-byte identical except the export name:

```tsx
"use client";
// ... all existing imports and code, unchanged ...
export function DashboardShell({ children }: { children: React.ReactNode }) {
  // ... existing body, unchanged ...
}
```
(Change only `export default function DashboardLayout(` → `export function DashboardShell(` at
line 156 — everything else in the file stays exactly as-is.)

### Step 2 — Create a new `layout.tsx` as a thin Server Component

```tsx
import type { Metadata } from "next";
import { DashboardShell } from "./DashboardShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
```

This is the entire structural change — the client component's behavior is completely unchanged,
it's just renamed and wrapped by a server-side metadata export.

## Files in scope

- `apps/web/src/app/dashboard/layout.tsx` (replaced with the new thin server wrapper shown above)
- `apps/web/src/app/dashboard/DashboardShell.tsx` (new file — the old `layout.tsx` content, renamed)

## Explicitly out of scope — do not touch

- Do not change any behavior, styling, hooks, or logic inside the renamed `DashboardShell.tsx` —
  this plan is a pure structural split for the metadata export, not a refactor of the dashboard
  shell itself.
- Do not add `noindex` to any route outside `/dashboard/*` — `/payment/` and `/onboarding` (also in
  the `robots.ts` disallow list) are separate, unselected findings; don't scope-creep into them.
- Do not remove the existing `disallow` entries in `robots.ts` — the meta tag and the robots.txt
  rule are complementary (defense in depth), not redundant; keep both.
- Check whether anything else in the codebase imports `DashboardLayout` by name (e.g. a test file,
  though this project has none, or a re-export) before renaming —
  `grep -rn "from \"./layout\"\|DashboardLayout" apps/web/src/app/dashboard` first. Next.js's
  routing itself only cares about the file being named `layout.tsx` and having a default export, so
  the rename is safe from the framework's perspective; this check is just for stray manual imports.

## Verification

1. `pnpm --filter @weelink/web build` — must compile with no errors (this route-segment split is a
   standard Next.js App Router pattern; if it errors, check that `DashboardShell` is imported and
   used correctly, and that no other file still imports the old default export from `./layout`).
2. Load any dashboard page (e.g. `/dashboard/products`) in a browser — must render and behave
   identically to before (nav, theme toggle, all existing interactivity) — this is a structural
   refactor with zero intended behavior change outside the new metadata.
3. View page source (or DevTools → Elements → `<head>`) on a dashboard page and confirm
   `<meta name="robots" content="noindex, nofollow">` is now present.
4. Confirm the public bio pages and marketing pages (`/`, `/about`, `/blog`, etc.) are unaffected —
   this change is scoped to the `/dashboard` route segment only.

## Maintenance note

If `/payment/` or `/onboarding` ever get the same `noindex` treatment in a future pass, follow this
exact same split pattern if their layouts are also Client Components — check each with
`grep -l '"use client"' apps/web/src/app/payment/layout.tsx apps/web/src/app/onboarding/layout.tsx`
first (they may not even have a dedicated layout file, in which case metadata can be added directly
to their `page.tsx` if those are Server Components).
