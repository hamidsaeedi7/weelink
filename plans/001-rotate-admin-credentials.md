# 001 — Remove hardcoded default admin credentials

Status: DONE — executed and live-verified in production
Written against commit: `6afe742`
Category: Security | Impact: High | Effort: S | Risk of fix: Low | Confidence: High

## Context

This is a Turborepo monorepo for "ویلینک" (Weelink), a Persian bio-link + storefront SaaS.
`apps/api` is NestJS 10 + Prisma 6 (PostgreSQL). `packages/db` holds the Prisma schema and a
seed script that bootstraps the first `SUPER_ADMIN` account.

`packages/db/prisma/seed.ts` falls back to a **hardcoded plaintext email and password** whenever
`ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars aren't set at seed time, and those exact same credentials
are printed in the repo's public-facing `README.md`. Anyone with read access to this repository —
now or in its git history, forever, even if you edit the file later — has a working admin login
for any deployment that was ever seeded without explicit env vars.

This is the single highest-severity finding from the audit: it requires no exploit, no chained
bug, just reading two files.

## Current state (verbatim, as of commit 6afe742)

`packages/db/prisma/seed.ts:1-20`:
```ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL || "hamid@weelink.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "H@mid1375";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || "09120000000",
      passwordHash,
      role: "SUPER_ADMIN",
      // ...fields continue below this excerpt
```

`README.md:38-41`:
```
## ورود ادمین

- **ایمیل:** `hamid@weelink.com`
- **رمز:** `H@mid1375`
```

`.env.example:40-43` (already has the placeholder vars, just not enforced):
```
# ─── Admin Seed ─────────────────────────────────────────────
ADMIN_EMAIL=hamid@weelink.com
ADMIN_PASSWORD=H@mid1375
ADMIN_PHONE=09120000000
```

## Why this matters

- The password is not a placeholder like `change_me` — it is a real, specific, complex-looking
  password (`H@mid1375`) that a maintainer plausibly reused elsewhere, and it is committed to git
  history and rendered in the README for anyone who clones the repo.
- If this project's production database was ever seeded without `ADMIN_PASSWORD` explicitly set
  in the deploy environment (a real possibility given deploys are manual/scripted, see plan 003),
  a full `SUPER_ADMIN` account with this exact password exists right now in production.
- `apps/api/src/main.ts:16-35` already has a precedent for this kind of fail-fast guard
  (`assertProductionConfig()`, checked at boot for `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/
  `FRONTEND_URL`) — extend the same pattern to the seed script instead of introducing a new one.

## What to do

### Step 1 — Rotate the credential first, before touching code

This is a credential-rotation situation, not just a code-review fix. Before or immediately after
merging the code change below:
1. Check production: is there a user with email `hamid@weelink.com` and was it ever created via
   an env-var-less seed run? (`SELECT id, email, "createdAt" FROM "User" WHERE email =
   'hamid@weelink.com';` via the production DB — read-only check.)
2. If such an account exists and its real intended owner still needs SUPER_ADMIN access, change
   its password immediately via the app's own "change password" flow (or a one-off `UPDATE`
   setting a freshly-bcrypt-hashed password) — do NOT reuse `H@mid1375` anywhere again.
3. **STOP and report back to the user** before doing this rotation step yourself if you are not
   certain which account in production corresponds to this seed default — do not guess and change
   the wrong user's password.

### Step 2 — Remove the hardcoded fallback from seed.ts

Edit `packages/db/prisma/seed.ts`. Replace the `||` fallback pattern with a hard requirement:

```ts
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminPhone = process.env.ADMIN_PHONE;
if (!adminEmail || !adminPassword || !adminPhone) {
  throw new Error(
    "ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE must all be set before running the seed script. " +
    "Refusing to fall back to a hardcoded default admin account.",
  );
}
```

Then use `adminEmail`/`adminPassword`/`adminPhone` (not `process.env.ADMIN_PHONE` again) in the
rest of the file — read the full file first (`packages/db/prisma/seed.ts` is short, well under
100 lines) to find every place these three env vars are referenced and update them consistently.

Also add a minimum-length/complexity check so a future run can't set `ADMIN_PASSWORD=123`:
```ts
if (adminPassword.length < 12) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
}
```

### Step 3 — Redact the README

Edit `README.md:38-41`. Replace the literal credentials with instructions to set env vars:

```markdown
## ورود ادمین

اکانت ادمین اولیه از طریق متغیرهای محیطی `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_PHONE` در
هنگام اجرای `pnpm db:seed` ساخته می‌شود (این متغیرها الزامی هستند — بدون آن‌ها seed با خطا
متوقف می‌شود). مقداری برای این متغیرها در فایل `.env` محلی خودتان تنظیم کنید؛ آن‌ها را در
گیت commit نکنید.
```

### Step 4 — Update `.env.example` to make the requirement obvious

Edit `.env.example:40-43`. Replace the real-looking default values with an obvious placeholder so
nobody copies `.env.example` to `.env` and unknowingly ships the old default:

```
# ─── Admin Seed (required — pnpm db:seed fails without these) ────────────────
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=REPLACE_WITH_A_STRONG_PASSWORD_12_CHARS_MIN
ADMIN_PHONE=09120000000
```

## Files in scope

- `packages/db/prisma/seed.ts`
- `README.md` (only the "ورود ادمین" section, lines ~38-41 — do not touch unrelated sections)
- `.env.example` (only the "Admin Seed" section, lines ~40-43)

## Explicitly out of scope — do not touch

- `apps/api/src/main.ts`'s `assertProductionConfig()` — that's a separate boot-time guard for
  JWT/FRONTEND_URL, covered by plan 008, not this plan. Don't add admin-credential checks there;
  the seed script only runs once, not on every boot.
- Do not attempt to programmatically detect/rotate the production credential yourself unless you
  are running with direct, confirmed production DB access and have completed Step 1's manual
  check — this is a "stop and ask" situation, not a "guess and fix" one.
- Do not change the `User` model or add new fields to `packages/db/prisma/schema.prisma`.

## Verification

1. `cd packages/db && pnpm exec ts-node prisma/seed.ts` (or however this project's `db:seed`
   script invokes it — check `packages/db/package.json`'s `seed` script) run with **no**
   `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_PHONE` set in the environment. Expected: the process
   throws the new error and exits non-zero — it must NOT create a user.
2. Run again with all three env vars set to test values (e.g. against a local/dev database, not
   production) and `ADMIN_PASSWORD` at least 12 chars. Expected: seed succeeds, a `SUPER_ADMIN`
   user is created/upserted with the email you provided.
3. Run again with `ADMIN_PASSWORD=short`. Expected: throws the length-check error.
4. `grep -n "H@mid1375\|hamid@weelink.com" -r . --include="*.md" --include="*.ts" --exclude-dir=node_modules`
   — expected: zero matches anywhere in the working tree after this change (the string will still
   exist in git history, which is a separate, unfixable-via-code concern — rotation in Step 1 is
   what neutralizes that).

## Maintenance note

Any future onboarding docs or setup scripts that reference "the default admin login" need to be
updated to point at the env-var requirement instead. If someone adds a Docker Compose seed step
or a CI job that runs `db:seed`, it must supply these three env vars explicitly or the pipeline
will now correctly fail.
