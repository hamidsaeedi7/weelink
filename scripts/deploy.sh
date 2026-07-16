#!/bin/bash
set -e

# ── Weelink Production Deploy Script ─────────────────────────────────────────
# Run as root on the server:
#   curl -fsSL https://raw.githubusercontent.com/hamidsaeedi7/weelink/main/scripts/deploy.sh | bash
# OR after cloning:
#   bash scripts/deploy.sh

DOMAIN="weeelink.ir"
REPO="https://github.com/hamidsaeedi7/weelink.git"
APP_DIR="/opt/weelink"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ویلینک — Production Deploy"
echo "  Domain: $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Install Docker if not present ─────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if ! command -v docker compose &>/dev/null 2>&1; then
  echo "📦 Installing Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
fi

# ── 2. Install Certbot ───────────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "🔐 Installing Certbot..."
  apt-get update -qq
  apt-get install -y certbot
fi

# ── 3. Clone / update repo ───────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "📥 Updating repo..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "📥 Cloning repo..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 4. Check .env.prod exists ────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env.prod" ]; then
  echo "⚠️  .env.prod not found! Creating from template..."
  cp "$APP_DIR/.env.prod.example" "$APP_DIR/.env.prod" 2>/dev/null || true
  echo "❌ Please fill in .env.prod then re-run this script."
  exit 1
fi

# ── 5. Get SSL certificate (standalone — stop nginx first) ───────────────────
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "🔐 Getting SSL certificate for $DOMAIN..."
  # Stop any existing nginx
  docker compose -f "$APP_DIR/docker-compose.prod.yml" --env-file "$APP_DIR/.env.prod" down --remove-orphans 2>/dev/null || true

  certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "api.$DOMAIN" \
    -d "modir.$DOMAIN" \
    --agree-tos \
    --non-interactive \
    --email "hamidrezasaeedizadeh@gmail.com"

  echo "✅ SSL certificate obtained"
fi

# ── 6. Build and start containers ────────────────────────────────────────────
echo "🚀 Building and starting containers..."
cd "$APP_DIR"

docker compose -f docker-compose.prod.yml --env-file .env.prod pull postgres redis nginx 2>/dev/null || true
docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo "⏳ Waiting for services..."
sleep 10

# ── 7. Apply DB schema changes ───────────────────────────────────────────────
# NOTE: this project has no Prisma migration history (packages/db/prisma/migrations/
# does not exist) — `prisma migrate deploy` has nothing to apply and will always fail.
# `db push` is the real schema-sync mechanism today. It is run WITHOUT --accept-data-loss
# so that any destructive change (dropped column, narrowed type, etc.) stops the deploy
# and requires a human to review and re-run manually with explicit acknowledgement,
# instead of silently proceeding.
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

# ── 8. Setup auto-renewal for SSL ────────────────────────────────────────────
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker exec \$(docker ps -qf name=weelink_nginx) nginx -s reload") | crontab -
  echo "✅ SSL auto-renewal configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deploy Complete!"
echo "  🌐 https://$DOMAIN"
echo "  🔧 https://modir.$DOMAIN"
echo "  🔌 https://api.$DOMAIN/api/v1/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker compose -f docker-compose.prod.yml --env-file .env.prod ps
