#!/bin/bash
# Enterprise Deployment Script for CitaIA (Hetzner Shared MySQL)
# This script should be run on the Hetzner server.

PROJECT_NAME="appointment"
BASE_DIR="/opt/pitaya/appointment"
API_DIR="$BASE_DIR/api"
REPO_URL="https://github.com/chessco/asistente"
NETWORK_NAME="pitaya_net"
MYSQL_CONTAINER="luxury-mysql-prod"
DB_NAME="appointment_db"

echo "--- A) PRECHECKS ---"
if ! command -v docker &> /dev/null; then
    echo "Error: Docker not installed."
    exit 1
fi

if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "Creating network $NETWORK_NAME..."
    docker network create "$NETWORK_NAME"
fi

if ! docker ps | grep -q "$MYSQL_CONTAINER"; then
    echo "Error: Shared MySQL container ($MYSQL_CONTAINER) is not running."
    exit 1
fi

echo "--- B) DIRECTORY STRUCTURE ---"
mkdir -p "$API_DIR"

echo "--- C) GIT SYNC ---"
if [ ! -d "$BASE_DIR/.git" ]; then
    echo "Cloning repository..."
    git clone "$REPO_URL" "$BASE_DIR"
else
    echo "Updating repository..."
    cd "$BASE_DIR"
    git pull origin main
fi

echo "--- D & E) VERIFY CONFIG FILES ---"
if [ ! -f "$API_DIR/docker-compose.prod.yml" ]; then
    echo "Error: docker-compose.prod.yml missing in $API_DIR"
    exit 1
fi

if [ ! -f "$API_DIR/.env.production" ]; then
    echo "Error: .env.production missing in $API_DIR"
    exit 1
fi

echo "--- F) DATABASE CREATION ---"
echo "Initializing $DB_NAME if missing..."
docker exec -i "$MYSQL_CONTAINER" mysql -uroot -p$LUXURY_PASS -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "--- G) DEPLOY ---"
cd "$API_DIR"

# Sincronizar esquema de base de datos (vital para nuevos campos)
echo "Sincronizando esquema de base de datos..."
docker compose -f docker-compose.prod.yml run --rm api npx prisma db push --skip-generate

docker compose -f docker-compose.prod.yml up -d --build

echo "--- H) VALIDATION ---"
docker ps | grep appointment-api-prod
docker logs --tail 50 appointment-api-prod

echo "--- SUCCESS ---"
echo "Deployment complete. Use Nginx Proxy Manager to point appointment-api.pitayacode.io to http://appointment-api-prod:3013"
