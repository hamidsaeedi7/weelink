#!/bin/bash
set -e

echo "🚀 Setting up Weelink..."

# Install dependencies
pnpm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker exec weelink_db pg_isready -U weelink -d weelink_db 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL ready"

# Wait for Redis
echo "⏳ Waiting for Redis..."
sleep 3

# Copy .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env created from .env.example"
fi

# Prisma setup
echo "🗄️  Running Prisma migrations..."
pnpm db:push
pnpm db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "  Start dev: pnpm dev"
echo "  Web:       http://localhost:3000"
echo "  Admin:     http://localhost:3001/modir"
echo "  API:       http://localhost:4000/api/v1"
echo "  DB Studio: pnpm db:studio"
echo ""
echo "  Admin login: hamid@weelink.com / H@mid1375"
