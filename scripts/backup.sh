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
