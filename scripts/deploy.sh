#!/usr/bin/env bash
set -euo pipefail

# ----------------------------
# Multi-site Deployment Script for Astro + Notion Booking Apps
# Usage:
#   ./deploy.sh <siteName> <branch>
# Example:
#   ./deploy.sh demoBuilds main
# ----------------------------

SITE_NAME="06-08-25"
BRANCH="applicationDemoBuilds"
ROOT_DIR="$VAR/WWW/"
ENV_FILE="$ROOT_DIR/.env"
ECOSYSTEM_CJS="$ROOT_DIR/ecosystem.config.cjs"
GITHUB_RAW_BASE="https://raw.githubusercontent.com/henryroman/06-08-25/${BRANCH}"
PM2_APP_NAME="astro-app-${SITE_NAME}"

echo "[deploy][${SITE_NAME}] branch=${BRANCH} root=${ROOT_DIR}"

# 1. Ensure project directory exists & pull latest changes
if [ ! -d "$ROOT_DIR" ]; then
  echo "[deploy][${SITE_NAME}] ERROR: directory $ROOT_DIR not found"
  exit 1
fi

cd "$ROOT_DIR"
echo "[deploy][${SITE_NAME}] fetching updates..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 2. Fetch the .env and ecosystem config from GitHub
echo "[deploy][${SITE_NAME}] downloading .env and PM2 config from GitHub"
curl -fsSL "${GITHUB_RAW_BASE}/.env.${SITE_NAME}" -o .env
curl -fsSL "${GITHUB_RAW_BASE}/ecosystem.config.cjs.${SITE_NAME}" -o ecosystem.config.cjs

# 3. Export environment variables for this shell
echo "[deploy][${SITE_NAME}] exporting .env variables"
export $(grep -v '^#' .env | xargs)

# 4. Generate Notion schema mapping
echo "[deploy][${SITE_NAME}] generating Notion schema"
npm run schema:generate

# 5. Build the application
echo "[deploy][${SITE_NAME}] building application (npm run build:all)"
npm run build:all

# 6. Restart PM2 process
if command -v pm2 >/dev/null 2>&1; then
  echo "[deploy][${SITE_NAME}] stopping existing PM2 app"
  pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
  pm2 delete "$PM2_APP_NAME" 2>/dev/null || true

  echo "[deploy][${SITE_NAME}] starting PM2 app"
  pm2 start ecosystem.config.cjs --name "$PM2_APP_NAME"
  pm2 save
else
  echo "[deploy][${SITE_NAME}] ERROR: pm2 not installed"
  exit 1
fi

# 7. Reload Nginx
echo "[deploy][${SITE_NAME}] reloading nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "[deploy][${SITE_NAME}] Deployment complete! App is running under PM2 as '$PM2_APP_NAME'."
