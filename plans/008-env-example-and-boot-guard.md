# 008 — Complete `.env.example` with undocumented env vars

Status: DONE — executed and live-verified in production
Written against commit: `6afe742`
Category: Docs / Secrets-Env mgmt | Impact: Medium | Effort: S | Risk of fix: Low | Confidence: High

## Context

`.env.example` is missing several env vars the API actually reads, so a new developer following
the README's `cp .env.example .env` step gets a server that boots fine but silently misconfigures
CDN/domain and Telegram features with no error — there's no crash, no log warning, just a feature
that quietly doesn't work. This plan only adds the missing documentation entries.

A related but separate finding — that some of these same fallback patterns (specifically
`API_URL`/`WEB_URL` on the payment-callback path) should also fail loudly at boot in production if
left unset — is covered by **plan 009**. Do not merge that work into this plan; they were
deliberately scoped as two separate, independent changes.

## Current state (verbatim)

Env vars read by the API but missing from `.env.example` (verbatim, current `.env.example`
has no entries for these):
```
apps/api/src/domains/arvan-cdn.service.ts:23       private readonly apiKey = process.env.ARVAN_API_KEY;
apps/api/src/content-plans/scheduler.service.ts:146  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
apps/api/src/content-plans/scheduler.service.ts:151  const base = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org')...
apps/api/src/content-plans/content-plans.controller.ts:67  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'WeeLink_Bot';
```
Plus `API_URL` and `WEB_URL` themselves (used above but absent from `.env.example`, which currently
only has `FRONTEND_URL`/`ADMIN_URL` — see `.env.example:29-34`).

## What to do

### Step 1 — Add the missing vars to `.env.example`

Edit `.env.example`. In the existing `# ─── App ───` section (currently lines 29-34), add `API_URL`
and `WEB_URL` alongside the existing `FRONTEND_URL`/`ADMIN_URL`:

```
# ─── App ────────────────────────────────────────────────────
API_PORT=4000
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:3000
WEB_URL=http://localhost:3000
API_URL=http://localhost:4000
ADMIN_URL=http://localhost:3001
NODE_ENV=development
```

Add a new section for the previously-undocumented integrations, with a comment noting they're
optional (matching this project's existing comment style, e.g. the `# SMS_PROVIDER: mock |
kavenegar` inline comment already in the file):

```
# ─── ArvanCloud CDN (optional — custom domain auto-provisioning) ─────────────
ARVAN_API_KEY=

# ─── Telegram bot (optional — content-plan auto-posting; fails soft if unset) ─
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=WeeLink_Bot
# Only set this if api.telegram.org is unreachable from your network/server and
# you're routing through a proxy.
TELEGRAM_API_BASE=
```

Place these new sections logically near existing related sections (e.g. after the "File Storage"
section and before "Admin Seed" — read the full current `.env.example` file first to match its
existing section ordering and comment-box style exactly, `# ─── Name ───...` with the box-drawing
character padding).

## Files in scope

- `.env.example` (add new lines/sections only — do not remove or reorder existing entries)

## Explicitly out of scope — do not touch

- Do not touch `apps/api/src/main.ts` or add any boot-time validation — that's plan 009's job,
  scoped separately on purpose. This plan is documentation-only.
- Do not touch any `apps/api/src/**` source file — this plan only adds lines to `.env.example`; it
  does not change what any service reads or how.
- Do not touch the 30+ frontend (`apps/web`) files with the analogous `NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"` pattern — out of scope for both this plan and plan 009 per the audit
  conversation (the selected fix set intentionally covers only the backend payment path).

## Verification

1. `cp .env.example .env` in a scratch copy of the repo (or just diff by eye) and confirm every env
   var referenced in `apps/api/src/**` via `grep -rn "process\.env\." apps/api/src` that isn't
   obviously test/internal-only now has a corresponding line in `.env.example`.
2. Visually confirm the new sections match the file's existing box-drawing comment style
   (`# ─── Name ───...`) and are placed in a sensible position relative to existing sections.
3. Confirm no existing line in `.env.example` was removed, reordered, or had its value changed —
   this should be a pure addition (`git diff .env.example` should show only added lines).

## Maintenance note

Any new integration that reads a `process.env.SOMETHING` value should get a corresponding
`.env.example` entry in the same PR that introduces it — this plan doesn't add automated
enforcement of that (e.g. a script diffing `grep`'d env var usage against `.env.example`), it just
fixes the current drift. If the drift recurs often, that automated-diff script would be a
reasonable future DX investment, not part of this plan.
