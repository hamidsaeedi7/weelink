# 005 — Remove SVG from the public image-upload allowlist

Status: TODO
Written against commit: `6afe742`
Category: Security (stored XSS) | Impact: Medium | Effort: S | Risk of fix: Low | Confidence: Medium

## Context

`apps/api/src/upload/upload.controller.ts` exposes `POST /upload/image`, used across the app for
avatar/banner/product/block images. The uploaded file is written to disk and served back publicly,
unmodified, via `ServeStaticModule` at `/uploads/*` (`apps/api/src/app.module.ts:41-48`) — with no
per-file `Content-Type` override, no `Content-Disposition`, no `X-Content-Type-Options: nosniff`.

## Current state (verbatim, `apps/api/src/upload/upload.controller.ts:32-36`)

```ts
const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new BadRequestException("فقط فایل‌های تصویری مجاز هستند"), false);
};
```

Used by (`upload.controller.ts:57-66`):
```ts
  @Post("image")
  @UseInterceptors(FileInterceptor("file", {
    storage: makeStorage("images"),
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File, @CurrentUser() _u: any) {
    if (!file) throw new BadRequestException("فایلی انتخاب نشده");
    return { url: `/uploads/images/${file.filename}`, filename: file.filename, size: file.size };
  }
```

Note: `POST /upload/image` is behind `@UseGuards(JwtAuthGuard)` at the controller level
(`upload.controller.ts:54-55`), so only logged-in shop owners can upload — this is not an
anonymous-attacker vector, it's an authenticated-user-uploads-content-later-viewed-by-others one
(the classic stored-XSS shape: any visitor who opens the uploaded file's direct URL in a new tab).

## Why this matters

SVG is an XML format and can embed `<script>` tags or event-handler attributes (`onload=`, etc.)
that execute when the SVG is navigated to directly as a document (not when merely embedded via
`<img src="...">`, which does not execute scripts inside the image — the risk is specifically
direct navigation to the `/uploads/images/xyz.svg` URL, e.g. via a shared link or someone
right-click-"open image in new tab"). `helmet()` is already applied globally in `main.ts:44`,
which provides some baseline CSP protection, but there is no verification in this codebase that
the CSP disallows inline script execution for a document served with `Content-Type: image/svg+xml`
navigated to directly, and relying on CSP alone as the only defense for a known file-format attack
vector is fragile — the input-level fix (don't accept SVG as "an image" in the first place) is
cheaper and more robust.

## What to do

Remove `.svg` from the accepted extension list. This is a one-line change:

Edit `apps/api/src/upload/upload.controller.ts:33`:
```ts
// before
const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
// after
const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
```

Do not attempt to "sanitize" SVGs to allow them safely (e.g. stripping `<script>` tags) — that is
a much larger, easy-to-get-wrong effort (SVG sanitization has a long history of bypasses) and is
out of scope for this fix. If the product genuinely needs SVG upload support in the future (e.g.
for a shop owner's logo), that should be a separate, deliberate piece of work using a dedicated
sanitization library and is not part of this plan.

## Files in scope

- `apps/api/src/upload/upload.controller.ts` (the `imageFilter` array on line 33 only)

## Explicitly out of scope — do not touch

- `videoFilter` (line 38-42) and `digitalFileFilter` (line 49-52) — those are separate allowlists
  for different upload endpoints (`.pdf`/`.docx`/etc. are expected there and are not an image-XSS
  vector in the same way; don't touch them).
- Do not add `Content-Disposition`/`X-Content-Type-Options` headers to the static file serving in
  `app.module.ts` as part of this plan — that's a broader change affecting all uploaded file types
  (and overlaps with plan 010's cache-header work in the same `ServeStaticModule.forRoot(...)`
  call); keep this plan scoped to the one-line filter fix only. If you want to also harden the
  static-serving headers, do it under plan 010 or flag it as a new follow-up finding instead of
  scope-creeping this plan.
- Do not add SVG sanitization.

## Verification

1. `pnpm --filter @weelink/api build` — must compile (this is a one-line array edit, should be a
   no-op for compilation, but confirm no lint/type regression).
2. Start the API locally, authenticate as a test user, `POST /upload/image` with a `.svg` file.
   Expected: HTTP 400 with the existing Persian error message ("فقط فایل‌های تصویری مجاز هستند").
3. `POST /upload/image` with a `.png` or `.jpg` file. Expected: unchanged — HTTP 200, file
   accepted and URL returned, exactly as before this change.
4. Search the frontend for any place that currently relies on SVG upload working (e.g. a "upload
   your logo as SVG" UI copy or an accepted-file-types hint in a file `<input accept="...">`):
   `grep -rn "\.svg\|image/svg" apps/web/src apps/admin/src`. If any UI explicitly advertises SVG
   support, flag this to the user before finalizing — removing backend support without updating
   that UI text would create a confusing "file rejected" experience for users who see "SVG
   allowed" in the UI copy.

## Maintenance note

If a designer/marketing need for SVG logo uploads comes up later, handle it as a distinct
feature: sanitize with a maintained library (e.g. DOMPurify's SVG profile or a server-side SVG
sanitizer), and serve those specific files with a locked-down `Content-Type` and `Content-Security-Policy: script-src 'none'` response header — don't just re-add `.svg` to this allowlist.
