# 010 — Add cache-control headers to served upload files

Status: DONE — executed and live-verified in production
Written against commit: `6afe742`
Category: Performance | Impact: Medium | Effort: S | Risk of fix: Low | Confidence: High

## Context

`apps/api/src/app.module.ts` serves everything under `apps/api`'s upload directory publicly via
`ServeStaticModule.forRoot(...)` at `/uploads/*` — avatar/banner/product images, course videos,
digital-file downloads. No cache headers are configured, so every request (including the same
visitor loading the same bio page twice) re-fetches the file from the API server instead of being
served from the browser's local cache.

## Current state (verbatim, `apps/api/src/app.module.ts:41-48`)

```ts
    ServeStaticModule.forRoot({
      // Must match where UploadController actually writes files (UPLOAD_DIR,
      // default ./uploads relative to cwd). The old "../../uploads" resolved to
      // the filesystem root in the container (cwd=/app) so NO uploaded image was
      // ever served → broken previews everywhere.
      rootPath: path.resolve(process.env.UPLOAD_DIR || "./uploads"),
      serveRoot: "/uploads",
    }),
```

Filename generation (`apps/api/src/upload/upload.controller.ts:25-28`) — confirms uploaded
filenames are already content-addressed-ish (timestamp + random suffix), which matters for the fix
below:
```ts
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
```

`@nestjs/serve-static` (installed version `4.0.2`, confirmed via
`node_modules/.pnpm/@nestjs+serve-static@4.0.2.../serve-static-options.interface.d.ts`) exposes a
`serveStaticOptions` key on `ServeStaticModuleOptions` that passes through to the underlying Express
`serve-static` middleware options (`maxAge`, `immutable`, etc.) — this is a documented, supported
config path, not a workaround.

## Why this matters

Every uploaded filename is generated once with `Date.now()` + a random suffix and never reused for
different content — the same URL always serves the same bytes for the lifetime of that file (a
shop owner replacing their avatar uploads a *new* file with a *new* filename; they don't overwrite
the old one in place, based on how `makeStorage`/`uploadImage` work: no delete-then-reuse-filename
logic exists). This makes every uploaded file safe to cache **immutably** and **forever** — the
browser never needs to re-validate it. Not caching these on the highest-traffic, most image-heavy
pages (public bio pages) means repeat visitors re-download the same avatar/banner/product images on
every visit.

## What to do

Edit `apps/api/src/app.module.ts`, add `serveStaticOptions` to the existing `ServeStaticModule.forRoot(...)` call:

```ts
    ServeStaticModule.forRoot({
      // Must match where UploadController actually writes files (UPLOAD_DIR,
      // default ./uploads relative to cwd). The old "../../uploads" resolved to
      // the filesystem root in the container (cwd=/app) so NO uploaded image was
      // ever served → broken previews everywhere.
      rootPath: path.resolve(process.env.UPLOAD_DIR || "./uploads"),
      serveRoot: "/uploads",
      // Filenames are generated once (Date.now() + random suffix, see
      // UploadController) and never reused for different content — safe to
      // cache forever; the browser never needs to re-validate.
      serveStaticOptions: {
        maxAge: "365d",
        immutable: true,
      },
    }),
```

`maxAge` accepts either a number of milliseconds or a string like `"365d"` per the underlying
`serve-static`/`ms` package convention already used elsewhere in this codebase's ecosystem — verify
the exact accepted format against the installed `serve-static@1.16.3` docs/types
(`node_modules/.pnpm/serve-static@1.16.3/...`) during Step 1 of Verification below; if the string
form isn't accepted by the installed version, use the millisecond number form instead:
`maxAge: 365 * 24 * 60 * 60 * 1000`.

## Files in scope

- `apps/api/src/app.module.ts` (only the `ServeStaticModule.forRoot(...)` call, add one key)

## Explicitly out of scope — do not touch

- Do not add `Content-Disposition`/`X-Content-Type-Options` headers here — that's a related but
  distinct hardening concern (raised in plan 005's discussion as explicitly deferred); this plan is
  scoped to cache performance only, not response-header security hardening. If you want to add
  those too, treat it as a separate follow-up finding, not scope creep on this plan.
- Do not change the filename-generation logic in `upload.controller.ts` — this plan assumes
  filenames are already effectively immutable/unique as they exist today; don't "improve" them
  (e.g. switching to a content hash) as part of this change.
- Do not add a CDN or reverse-proxy caching layer — this is purely the origin server's own
  `Cache-Control` response header; infrastructure-level caching (e.g. via ArvanCloud, which this
  project already uses for the CDN in front of the storefront) is a separate, larger conversation.

## Verification

1. `pnpm --filter @weelink/api build` — must compile with no TypeScript errors.
2. Start the API locally, upload a test image via `POST /upload/image`, then
   `curl -I http://localhost:4000/uploads/images/<returned-filename>` — expected: response
   includes a `Cache-Control` header containing `max-age=31536000` (365 days in seconds) and
   `immutable`.
3. Load a real bio page in a browser with dev tools open (Network tab), hard-refresh once, then
   normal-refresh again. Expected: on the second load, uploaded image requests show `(from disk
   cache)` / `(from memory cache)` in the Network tab instead of a fresh 200 response, confirming
   the browser is honoring the new header.
4. Confirm non-upload API routes (e.g. `GET /api/v1/shops/:slug`) are unaffected — this
   `serveStaticOptions` only applies to the `/uploads/*` static-file route, not to the NestJS
   controller routes; spot-check that a regular API JSON response still has no unexpected
   `Cache-Control` header added.

## Maintenance note

If this project ever adds a "replace file in place, same URL" feature (overwriting an existing
upload's content while keeping its filename/URL), that would break the "immutable forever" premise
of this cache policy — such a feature would need to generate a new filename/URL per change (as the
current upload flow already does) rather than mutating an existing one in place, or this cache
setting would need to be revisited.
