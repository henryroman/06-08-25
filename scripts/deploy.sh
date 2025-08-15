#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$HOME/your-repo"
BRANCH="${1:-main}"
ENV_FILE="$ROOT_DIR/.env"

echo "[deploy] branch=$BRANCH root=$ROOT_DIR"

if [ ! -d "$ROOT_DIR" ]; then
  echo "[deploy] directory $ROOT_DIR not found — cloning template (if repo env set)"
  if [ -z "${GITHUB_REPO:-}" ]; then
    echo "[deploy] GITHUB_REPO not set, aborting"
    exit 1
  fi
  git clone --branch "$BRANCH" "$GITHUB_REPO" "$ROOT_DIR"
fi

cd "$ROOT_DIR"

echo "[deploy] fetching updates..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# ensure node + npm installed
if ! command -v node >/dev/null 2>&1; then
  echo "[deploy] node not found"
  exit 1
fi

echo "[deploy] installing dependencies..."
npm ci

echo "[deploy] building (build:all)..."
npm run build:all || npm run build || (echo "[deploy] build failed" && exit 1)

# start/restart via pm2 (assumes ecosystem file exists)
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete demo-heavenly-nails || true
  pm2 start ecosystem.config.js
  pm2 save
else
  echo "[deploy] pm2 not found - run pm2 startup and pm2 install"
fi

echo "[deploy] finished"
