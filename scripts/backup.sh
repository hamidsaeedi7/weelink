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
