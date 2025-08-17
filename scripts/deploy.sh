#!/usr/bin/env bash
set -euo pipefail

# Configuration
REPO="https://github.com/henryroman/06-08-25.git"
DEFAULT_BRANCH="applicationDemoBuilds"
BASE_DIR="/var/www/sites"
KEEP_RELEASES=5
PORT_BASE=3001
NGINX_MAP="/etc/nginx/conf.d/sites-ports-map.conf"
PM2_PREFIX="astro-site-"
USER="ubuntu"
DOMAIN_BASE="demowebsitehosting.com"

# Ensure directories exist
sudo mkdir -p "$BASE_DIR"
sudo chown "$USER":"$USER" "$BASE_DIR"

SITE_ID="${1:?Usage: $0 <site-id> [branch]}"
BRANCH="${2:-$DEFAULT_BRANCH}"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="$BASE_DIR/$SITE_ID/releases/$TIMESTAMP"
CURRENT_LINK="$BASE_DIR/$SITE_ID/current"

echo "[deploy][$SITE_ID] Starting deployment - branch=$BRANCH release=$TIMESTAMP"

# Create site directories
sudo -u "$USER" mkdir -p "$BASE_DIR/$SITE_ID/releases"
sudo -u "$USER" mkdir -p "$BASE_DIR/$SITE_ID/shared"

# Read .env from stdin if provided
if [ ! -t 0 ]; then
    echo "[deploy][$SITE_ID] Reading .env from stdin"
    sudo -u "$USER" mkdir -p "$RELEASE_DIR"
    sudo -u "$USER" tee "$RELEASE_DIR/.env" > /dev/null
fi

# Clone repository
echo "[deploy][$SITE_ID] Cloning repository"
sudo -u "$USER" git clone --depth 1 --branch "$BRANCH" "$REPO" "$RELEASE_DIR"

# Determine or allocate port
ALLOC_PORT=""
if [ -L "$CURRENT_LINK" ] && [ -f "$CURRENT_LINK/.env" ]; then
    val="$(grep -E '^PORT=' "$CURRENT_LINK/.env" || true)"
    if [ -n "$val" ]; then
        ALLOC_PORT="${val#PORT=}"
        echo "[deploy][$SITE_ID] Reusing existing PORT=$ALLOC_PORT"
    fi
fi

if [ -z "$ALLOC_PORT" ]; then
    site_count=$(ls -1 "$BASE_DIR" 2>/dev/null | wc -l || echo 0)
    ALLOC_PORT=$((PORT_BASE + site_count))
    echo "[deploy][$SITE_ID] Allocated new PORT=$ALLOC_PORT"
fi

# Ensure PORT is in .env
if [ -f "$RELEASE_DIR/.env" ]; then
    if ! grep -q '^PORT=' "$RELEASE_DIR/.env"; then
        echo "PORT=$ALLOC_PORT" | sudo -u "$USER" tee -a "$RELEASE_DIR/.env" > /dev/null
    fi
    # Update PUBLIC_SITE_URL if present
    if grep -q '^PUBLIC_SITE_URL=' "$RELEASE_DIR/.env"; then
        sudo -u "$USER" sed -i "s|^PUBLIC_SITE_URL=.*|PUBLIC_SITE_URL=https://${SITE_ID}.${DOMAIN_BASE}|" "$RELEASE_DIR/.env"
    else
        echo "PUBLIC_SITE_URL=https://${SITE_ID}.${DOMAIN_BASE}" | sudo -u "$USER" tee -a "$RELEASE_DIR/.env" > /dev/null
    fi
else
    echo "PORT=$ALLOC_PORT" | sudo -u "$USER" tee "$RELEASE_DIR/.env" > /dev/null
    echo "PUBLIC_SITE_URL=https://${SITE_ID}.${DOMAIN_BASE}" | sudo -u "$USER" tee -a "$RELEASE_DIR/.env" > /dev/null
fi

# Build application
echo "[deploy][$SITE_ID] Building application"
sudo -u "$USER" bash -c "
    set -o allexport
    source '$RELEASE_DIR/.env'
    set +o allexport
    cd '$RELEASE_DIR'

    if [ -f package-lock.json ]; then
        npm ci --silent
    else
        npm install --silent --no-audit --no-fund
    fi

    echo '[deploy][$SITE_ID] Running schema generation'
    npm run schema:generate || true

    echo '[deploy][$SITE_ID] Running build:all'
    npm run build:all
"

# Create PM2 ecosystem config
cat > "$RELEASE_DIR/ecosystem.config.cjs" <<ECOEOF
module.exports = {
  apps: [
    {
      name: "${PM2_PREFIX}${SITE_ID}",
      script: "./dist/server/entry.mjs",
      cwd: "${RELEASE_DIR}",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "${ALLOC_PORT}",
        HOST: "0.0.0.0"
      },
      error_file: "/var/log/pm2/${PM2_PREFIX}${SITE_ID}-error.log",
      out_file: "/var/log/pm2/${PM2_PREFIX}${SITE_ID}-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      env_file: ".env",
      kill_timeout: 5000,
      listen_timeout: 3000,
      restart_delay: 1000
    }
  ]
};
ECOEOF

sudo chown "$USER":"$USER" "$RELEASE_DIR/ecosystem.config.cjs"

# Start/restart PM2 process
echo "[deploy][$SITE_ID] Starting PM2 process on port $ALLOC_PORT"
sudo -u "$USER" pm2 delete "${PM2_PREFIX}${SITE_ID}" > /dev/null 2>&1 || true
sudo -u "$USER" pm2 start "$RELEASE_DIR/ecosystem.config.cjs" --name "${PM2_PREFIX}${SITE_ID}" --update-env
sudo -u "$USER" pm2 save

# Update current symlink
echo "[deploy][$SITE_ID] Updating current symlink"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
sudo chown -h "$USER":"$USER" "$CURRENT_LINK"

# Update nginx port mapping
if [ ! -f "$NGINX_MAP" ]; then
    echo "[deploy][$SITE_ID] Creating nginx map file"
    sudo tee "$NGINX_MAP" > /dev/null <<'MAPEOF'
# Auto-generated site->port map
map $siteid $site_port {
    default 3000;
}
MAPEOF
fi

# Update port mapping
tmpfile="$(mktemp)"
sudo awk '/^[[:space:]]*[a-zA-Z0-9._-]+[[:space:]]+[0-9]+;/{print $1" "$2}' "$NGINX_MAP" 2>/dev/null | sort -u > "$tmpfile" || true
grep -v "^${SITE_ID} " "$tmpfile" > "${tmpfile}.2" || true
echo "${SITE_ID} ${ALLOC_PORT};" >> "${tmpfile}.2"

{
    echo "# Auto-generated site->port map"
    echo "map \$siteid \$site_port {"
    echo "    default 3000;"
    sort -k1,1 "${tmpfile}.2" | awk '{print "    "$1" "$2}'
    echo "}"
} | sudo tee "$NGINX_MAP" > /dev/null

rm -f "$tmpfile" "${tmpfile}.2"

# Cleanup old releases
echo "[deploy][$SITE_ID] Cleaning up old releases"
sudo -u "$USER" bash -c "cd '$BASE_DIR/$SITE_ID/releases' && ls -1tr | head -n -$KEEP_RELEASES 2>/dev/null | xargs -r rm -rf --"

# Test and reload nginx
echo "[deploy][$SITE_ID] Reloading nginx"
sudo nginx -t && sudo systemctl reload nginx

# Output results
echo "DEPLOY_OK"
echo "url=https://${SITE_ID}.${DOMAIN_BASE}/"
echo "port=${ALLOC_PORT}"
