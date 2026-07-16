# 014 — Fix backup.sh: include uploads, work against production

Status: TODO
Written against commit: `74e98a3`
Category: Backup | Impact: High | Effort: S | Risk of fix: Low | Confidence: High

## Context

`scripts/backup.sh` (referenced from `README.md`'s "بکاپ دیتابیس" section) is this project's only
backup mechanism, and it has two independent problems that together mean **production likely has
no working backup today**:

1. It only backs up the Postgres database — never the `uploads` directory (product images,
   avatars, course videos, digital files sold to customers). Losing the volume/disk loses all of
   that even if the DB backup survives.
2. It runs `docker exec weelink_db ...` — `weelink_db` is the `container_name` set only in
   `docker-compose.yml` (local dev). `docker-compose.prod.yml`'s `postgres` service has **no**
   `container_name` (confirmed by reading the file), so Docker Compose auto-generates one from the
   project directory + service name (this project's actual running production containers are named
   `weelink-postgres-1`, `weelink-api-1`, etc. — confirmed from this session's own deploy history).
   Running this script as-is on the production server fails with "no such container."

## Current state (verbatim, `scripts/backup.sh`, full file)

```bash
#!/bin/bash
# Backup PostgreSQL database
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./scripts/backup/weelink_${DATE}.sql"

mkdir -p ./scripts/backup

docker exec weelink_db pg_dump -U weelink weelink_db > "$BACKUP_FILE"
echo "✅ Backup saved: $BACKUP_FILE"

# Keep last 7 backups
ls -t ./scripts/backup/*.sql | tail -n +8 | xargs -r rm
echo "🧹 Old backups cleaned"
```

`docker-compose.prod.yml`'s relevant service definitions (no `container_name` set on any service —
confirmed by reading the full file):
```yaml
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: weelink
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: weelink_db
    # ...no container_name...

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    env_file: .env.prod
    # ...no container_name...
```

`apps/api/src/upload/upload.controller.ts:16`:
```ts
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
```
This resolves relative to the API container's working directory, which is `/app` (per
`Dockerfile.api`'s `WORKDIR /app`) — so the uploads directory inside the `api` container is
`/app/uploads` **unless** `UPLOAD_DIR` is set to something else in `.env.prod`. **Verify the actual
value of `UPLOAD_DIR` in production's `.env.prod` before hardcoding `/app/uploads` below** — check
via `grep '^UPLOAD_DIR=' .env.prod` on the server (this only reveals a path, not a secret, so it's
safe to read directly) and adjust the path in Step 2 if it differs.

## What to do

### Step 1 — Use `docker compose exec` (by service name) instead of `docker exec` (by container name)

This is the core fix for problem #2: `docker compose exec &lt;service&gt;` resolves the actual
running container for that service regardless of what Compose auto-generated its name as — it
works identically whether run against the dev compose file (`weelink_db`) or the prod one
(`weelink-postgres-1` or whatever Compose named it), because it's keyed by service name, not
container name.

### Step 2 — Rewrite `scripts/backup.sh`

```bash
#!/bin/bash
set -e
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./scripts/backup"
mkdir -p "$BACKUP_DIR"

# Use the prod compose file when run from the production deploy directory (identified
# by the presence of .env.prod); otherwise fall back to local dev compose.
if [ -f .env.prod ]; then
  COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
else
  COMPOSE="docker compose -f docker-compose.yml"
fi

# --- Database ---
DB_FILE="$BACKUP_DIR/weelink_db_${DATE}.sql"
$COMPOSE exec -T postgres pg_dump -U weelink weelink_db > "$DB_FILE"
echo "✅ Database backup saved: $DB_FILE"

# --- Uploads (product images, avatars, course videos, digital files) ---
UPLOADS_FILE="$BACKUP_DIR/weelink_uploads_${DATE}.tar.gz"
if $COMPOSE exec -T api sh -c "tar -czf - -C /app/uploads ." > "$UPLOADS_FILE" 2>/dev/null && [ -s "$UPLOADS_FILE" ]; then
  echo "✅ Uploads backup saved: $UPLOADS_FILE"
else
  rm -f "$UPLOADS_FILE"
  echo "⚠️  Uploads backup failed — check UPLOAD_DIR path inside the api container"
fi

# --- Retention: keep last 7 of each ---
ls -t "$BACKUP_DIR"/weelink_db_*.sql 2>/dev/null | tail -n +8 | xargs -r rm
ls -t "$BACKUP_DIR"/weelink_uploads_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm
echo "🧹 Old backups cleaned"
```

Adjust the `-C /app/uploads` path in the uploads backup command if Step 1's check of production's
actual `UPLOAD_DIR` value shows something other than the default.

### Step 3 — Confirm the README's documented command still works

`README.md`'s "بکاپ دیتابیس" section currently says:
```bash
bash scripts/backup.sh
```
This still works unchanged — no README edit needed unless you want to mention that uploads are now
included too (optional, small documentation improvement, not required for this fix).

## Files in scope

- `scripts/backup.sh` (full rewrite, as shown above)

## Explicitly out of scope — do not touch

- Do not add offsite/remote backup upload (S3, rsync to another host, etc.) in this plan — that's a
  separate, larger piece of work (a previously-deferred finding: "backups are local-disk only, no
  offsite copy"). This plan only fixes correctness (uploads included, works against prod) — it does
  not change where backups are stored.
- Do not add a cron schedule for this script in this plan — another deferred finding
  ("backup.sh not scheduled anywhere") covers that; this plan is scoped to making the script itself
  correct first.
- Do not touch `docker-compose.yml` or `docker-compose.prod.yml` — no service definitions need to
  change for this fix, only how the script addresses them.

## Verification

1. `bash -n scripts/backup.sh` — confirms valid bash syntax (parse-only, no execution).
2. Run against local dev (`docker-compose up -d` per README, then `bash scripts/backup.sh` from the
   repo root with no `.env.prod` present) — expected: both a `.sql` file and a `.tar.gz` file appear
   in `scripts/backup/`, both non-empty. Confirm the `.sql` file has real SQL content (`head -20` on
   it) and the `.tar.gz` extracts to real files matching what's in your local `uploads/` folder.
3. **Do not run Step 2 destructively against production without confirming with the user first** —
   this is a read-only backup operation (pg_dump and tar are non-mutating), so it's low-risk, but
   confirm the exact `UPLOAD_DIR` path from Step 1 before running on the production server, and
   report the resulting backup file sizes back so the user can sanity-check them (e.g. an
   unexpectedly-tiny uploads tarball would indicate the path was wrong).
4. After a successful production run, `ls -la scripts/backup/` on the server and confirm both file
   types are present with recent timestamps and non-trivial sizes.

## Maintenance note

This plan intentionally does not add scheduling or offsite storage — treat those as natural
follow-ups once this script is confirmed correct. When they're added, the offsite-upload step
should run only after both local backup files are confirmed non-empty (don't ship a broken/empty
backup offsite and call it done).
