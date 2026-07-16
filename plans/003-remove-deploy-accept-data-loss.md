# 003 — Remove silent `--accept-data-loss` fallback from deploy.sh

Status: DONE — executed and live-verified in production
Written against commit: `6afe742`
Category: Migrations / Deploy safety | Impact: High | Effort: S | Risk of fix: Low | Confidence: High

## Context

There is no Prisma migration history in this project (`packages/db/prisma/migrations/` does not
exist and never has). All schema changes have historically been applied to production manually
via raw SQL `ALTER TABLE` over SSH. `scripts/deploy.sh` is a deploy script that — separately from
that manual reality — attempts an automated `prisma migrate deploy` step and, because there is no
migration history for it to apply, that command always fails. The script then **silently falls
through to `prisma db push --accept-data-loss`** with the first command's stderr suppressed.

This means: if `scripts/deploy.sh` is ever actually run (as opposed to the manual process this
session has used throughout), the *real* production schema-deploy mechanism is
`--accept-data-loss`, which lets Prisma drop columns / narrow types / delete data to force the
live schema to match `schema.prisma`, with zero human review of the diff before it happens.

## Current state (verbatim, `scripts/deploy.sh:87-92`)

```bash
# ── 7. Run DB migrations ─────────────────────────────────────────────────────
echo "🗃️  Running database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api \
  npx prisma migrate deploy --schema=/app/packages/db/prisma/schema.prisma 2>/dev/null || \
  docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api \
  npx prisma db push --schema=/app/packages/db/prisma/schema.prisma --accept-data-loss
```

## Why this matters

`--accept-data-loss` is meant as an explicit, human-invoked opt-in for destructive schema changes
in development — not something that should run unattended as a fallback in a production deploy
script. Combined with the total absence of migration history, this script currently has no path
that does NOT risk data loss: the "safe" first branch (`migrate deploy`) is guaranteed to fail
every single time (there's nothing to deploy), so the destructive branch is the only branch that
ever actually runs.

## What to do

This plan does **not** attempt to retrofit real Prisma migration history (that's a separate,
higher-risk piece of work — see the "considered and rejected for this plan" note below). It makes
the deploy script honest and safe given the migration-less reality that exists today:

Edit `scripts/deploy.sh`, replacing lines 87-92:

```bash
# ── 7. Apply DB schema changes ───────────────────────────────────────────────
# NOTE: this project has no Prisma migration history (packages/db/prisma/migrations/
# does not exist) — `prisma migrate deploy` has nothing to apply and will always fail.
# `db push` is the real schema-sync mechanism today. It is run WITHOUT --accept-data-loss
# so that any destructive change (dropped column, narrowed type, etc.) stops the deploy
# and requires a human to review and re-run manually with explicit acknowledgement,
# instead of silently proceeding. See plans/README.md for the migration-history gap.
echo "🗃️  Syncing database schema..."
if ! docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api \
  npx prisma db push --schema=/app/packages/db/prisma/schema.prisma; then
  echo ""
  echo "❌ Schema sync failed or requires data loss to proceed."
  echo "   Review the diff above. If the destructive change is intentional, re-run manually:"
  echo "   docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api \\"
  echo "     npx prisma db push --schema=/app/packages/db/prisma/schema.prisma --accept-data-loss"
  echo ""
  exit 1
fi
```

This makes the deploy script:
1. Stop pretending `migrate deploy` will ever succeed (removes the misleading first attempt).
2. Fail loudly and stop the deploy (`exit 1`) if Prisma detects the change would be destructive,
   instead of silently proceeding.
3. Print the exact manual command a human can run if they've reviewed the diff and the data loss
   is genuinely intended — preserving the escape hatch without it being the unattended default.

## Files in scope

- `scripts/deploy.sh` (only the "Run DB migrations" section, lines ~87-92)

## Explicitly out of scope — do not touch

- Do not create `packages/db/prisma/migrations/` or attempt to baseline migration history against
  production in this plan — that requires careful, deliberate work against a live, already-drifted
  database and is a separate effort (flag it to the user as a candidate follow-up plan, don't do
  it here).
- Do not change any other step of `scripts/deploy.sh` (image build, SSL renewal, etc.) — this repo
  doesn't actually run this script for its real deploys (deploys are manual, per project history),
  so treat every other line as out of scope and unrelated to this finding.
- Do not modify `docker-compose.prod.yml`.

## Verification

This script only runs against a live production Docker Compose stack, so there is no safe way to
execute it end-to-end as part of this plan. Verify by inspection and dry-run instead:

1. `bash -n scripts/deploy.sh` — confirms the script is still valid bash syntax after the edit
   (this does not execute anything, just parses).
2. Read the edited section back and confirm: (a) `2>/dev/null` and the `||` fallback to
   `migrate deploy` are gone, (b) `--accept-data-loss` no longer appears in the automatic path,
   (c) the script `exit 1`s on failure instead of silently continuing to the next deploy step.
3. Report to the user in your summary that this script is not part of the actual current deploy
   process (per project history) — so this fix reduces latent risk for whenever the script *is*
   eventually used, but does not change today's manual deploy behavior. Confirm with the user
   whether they still use any part of this script before considering it fully "done."

## Maintenance note

If/when this project adopts real Prisma migrations (a natural follow-up to this finding), this
script's schema-sync step should be replaced with `prisma migrate deploy` as the *only* path, with
no `db push` fallback at all — `db push` and migration-based deploys should not be mixed long-term.
