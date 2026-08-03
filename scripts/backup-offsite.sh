#!/usr/bin/env bash
#
# Ships the newest local backup off the server, encrypted.
#
# Runs after backup.sh. Kept as a separate script on purpose: if the upload
# fails (network, quota, expired key) the local backup has already succeeded
# and must not be reported as failed.
#
# Every artifact is GPG-symmetrically encrypted BEFORE it leaves the box —
# a backup contains the full customer database and the production env file
# (payment gateway merchant id, CDN and SMS keys), none of which should sit
# in third-party storage in the clear.
#
# Setup (once):
#   1. /root/.weelink-backup-passphrase   chmod 600, the GPG passphrase
#   2. rclone remote named "offsite"      rclone config, S3-compatible
# Until both exist this script exits 0 with a message, so cron stays quiet.
#
# Cron:  15 3 * * * cd /opt/weelink && /bin/bash scripts/backup.sh && /bin/bash scripts/backup-offsite.sh
#
# Env knobs: BACKUP_DIR, OFFSITE_REMOTE (default offsite:weelink-backups),
#            OFFSITE_RETENTION_DAYS (default 30).

set -Eeuo pipefail
umask 077

BACKUP_DIR="${BACKUP_DIR:-/opt/weelink-backups}"
PASSFILE="${PASSFILE:-/root/.weelink-backup-passphrase}"
REMOTE="${OFFSITE_REMOTE:-offsite:weelink-backups}"
RETENTION_DAYS="${OFFSITE_RETENTION_DAYS:-30}"

# --- preconditions ----------------------------------------------------------
if ! command -v rclone >/dev/null; then
  echo "offsite: rclone not installed — skipping"; exit 0
fi
if [[ ! -s "$PASSFILE" ]]; then
  echo "offsite: no passphrase at $PASSFILE — skipping (see header for setup)"; exit 0
fi
if ! rclone listremotes 2>/dev/null | grep -q "^${REMOTE%%:*}:"; then
  echo "offsite: rclone remote '${REMOTE%%:*}' not configured — skipping"; exit 0
fi

# --- pick the newest local backup -------------------------------------------
LATEST="$(ls -1dt "$BACKUP_DIR"/*/ 2>/dev/null | head -1 || true)"
if [[ -z "$LATEST" ]]; then
  echo "offsite: no local backup found in $BACKUP_DIR" >&2; exit 1
fi
LATEST="${LATEST%/}"
STAMP="$(basename "$LATEST")"

STAGING="$(mktemp -d)"
# mktemp dirs survive a crash; make sure we never leave decrypted-adjacent
# plaintext copies lying around even if the upload throws.
trap 'rm -rf -- "$STAGING"' EXIT

# --- encrypt ----------------------------------------------------------------
shopt -s nullglob
for f in "$LATEST"/*; do
  [[ -f "$f" ]] || continue
  gpg --batch --yes --quiet \
      --symmetric --cipher-algo AES256 \
      --passphrase-file "$PASSFILE" \
      --output "$STAGING/$(basename "$f").gpg" \
      "$f"
done
shopt -u nullglob

COUNT="$(find "$STAGING" -type f -name '*.gpg' | wc -l)"
if [[ "$COUNT" -eq 0 ]]; then
  echo "offsite: nothing to upload from $LATEST" >&2; exit 1
fi

# Prove the encryption is reversible before trusting it off-site. A backup you
# cannot decrypt is not a backup.
FIRST="$(find "$STAGING" -type f -name '*.gpg' | head -1)"
gpg --batch --quiet --decrypt --passphrase-file "$PASSFILE" "$FIRST" >/dev/null

# --- upload -----------------------------------------------------------------
rclone copy "$STAGING" "$REMOTE/$STAMP" --s3-no-check-bucket --transfers 2

# --- verify what actually landed --------------------------------------------
REMOTE_COUNT="$(rclone lsf "$REMOTE/$STAMP" 2>/dev/null | wc -l)"
if [[ "$REMOTE_COUNT" -ne "$COUNT" ]]; then
  echo "offsite: FAILED — uploaded $REMOTE_COUNT of $COUNT files to $REMOTE/$STAMP" >&2
  exit 1
fi

# --- remote retention -------------------------------------------------------
rclone delete "$REMOTE" --min-age "${RETENTION_DAYS}d" 2>/dev/null || true
rclone rmdirs "$REMOTE" --leave-root 2>/dev/null || true

echo "offsite: uploaded $COUNT encrypted file(s) to $REMOTE/$STAMP"
