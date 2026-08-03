#!/usr/bin/env bash
#
# Weelink backup — database, uploads and the production env file.
#
# This is the canonical copy. It was reconciled with the version running on the
# production server on 2026-08-04: the two had drifted (this file hardcoded the
# DB credentials, skipped integrity checks, ran without `set -e`, and wrote into
# the git working tree). The server's hardened version won, so this file is now
# byte-identical to /opt/weelink/scripts/backup.sh apart from the env-file step
# added below.
#
# Run from anywhere:  bash scripts/backup.sh
# Cron on prod:       15 3 * * * cd /opt/weelink && /bin/bash scripts/backup.sh >> /var/log/weelink-backup.log 2>&1
#
# Env knobs: BACKUP_DIR (default /opt/weelink-backups on prod), RETENTION_DAYS (14).

set -Eeuo pipefail

# 077 matters: each backup holds a full database dump and the production env
# file, so nothing here may be group- or world-readable.
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$PROJECT_DIR/.env.prod" ]]; then
  COMPOSE=(docker compose --env-file "$PROJECT_DIR/.env.prod" -f "$PROJECT_DIR/docker-compose.prod.yml")
  BACKUP_DIR="${BACKUP_DIR:-/opt/weelink-backups}"
else
  COMPOSE=(docker compose -f "$PROJECT_DIR/docker-compose.yml")
  BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backup}"
fi

if [[ -z "$BACKUP_DIR" || "$BACKUP_DIR" == "/" ]]; then
  echo "Refusing to use an unsafe backup directory" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%d-%H%M%S)"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DESTINATION="$BACKUP_DIR/$STAMP"
mkdir -p "$DESTINATION"

# --- Database ---------------------------------------------------------------
# User and database name come from the container's own env rather than being
# hardcoded, so this keeps working if either is ever changed.
DB_FILE="$DESTINATION/postgres.sql.gz"
"${COMPOSE[@]}" exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip -9 > "$DB_FILE"
gzip -t "$DB_FILE"

# --- Uploads ----------------------------------------------------------------
UPLOADS_FILE="$DESTINATION/uploads.tar.gz"
"${COMPOSE[@]}" exec -T api sh -lc \
  'tar -czf - -C "${UPLOAD_DIR:-/app/uploads}" .' > "$UPLOADS_FILE"
tar -tzf "$UPLOADS_FILE" >/dev/null

# --- Production env ---------------------------------------------------------
# The server's .env.prod carries keys the repo copy does not (payment gateway,
# CDN, Telegram proxy). A backup without it cannot rebuild the stack — exactly
# the gap found on 2026-08-04. Written 0600 by the umask above.
if [[ -f "$PROJECT_DIR/.env.prod" ]]; then
  cp "$PROJECT_DIR/.env.prod" "$DESTINATION/env.prod"
fi

# --- Retention --------------------------------------------------------------
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d \
  -mtime "+$RETENTION_DAYS" -exec rm -rf -- {} +

echo "Backup completed: $DESTINATION"
du -h "$DESTINATION"/* 2>/dev/null
