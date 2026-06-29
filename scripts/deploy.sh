#!/bin/bash
set -e

echo "Deploying Weelink..."

# Pull latest code
git pull origin main

# Load env vars for Prisma migration
set -a
source .env.prod
set +a

# Run DB migrations
echo "Running database migrations..."
cd packages/db
npx prisma db push --accept-data-loss
cd ../..

# Rebuild images and restart containers
echo "Rebuilding and restarting containers..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Prune unused images / layers
docker system prune -f

echo "Deploy complete!"
