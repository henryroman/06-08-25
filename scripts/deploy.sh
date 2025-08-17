#!/usr/bin/env bash
set -euo pipefail

# Config
REPO="https://github.com/henryroman/06-08-25.git"
DEFAULT_BRANCH="main"
BASE_DIR="/var/www/sites"
KEEP_RELEASES=5
PORT_BASE=3001
NGINX_MAP="/etc/nginx/conf.d/sites-ports-map.conf"
PM2_PREFIX="astro-site-"
RUN_USER="ubuntu"
DOMAIN_BASE="demowebsitehosting.com"

SITE_ID="${1:?Usage: $0 <site-id> [branch] < .env}"
BRANCH="${2:-$DEFAULT_BRANCH}"

# Per-site lock
LOCK_DIR="/tmp/deploy-${SITE_ID}.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "[deploy][$SITE_ID] Another deploy in progress." >&2
  exit 1
fi
trap 'rc=$?; rm -rf "$LOCK_DIR"; exit $rc' EXIT

# Setup directories
sudo mkdir -p "$BASE_DIR"
sudo chown "$RUN_USER":"$RUN_USER" "$BASE_DIR"
sudo -u "$RUN_USER" mkdir -p "$BASE_DIR/$SITE_ID/releases" "$BASE_DIR/$SITE_ID/shared"
CURRENT_LINK="$BASE_DIR/$SITE_ID/current"

# Allocate release dir
make_release_dir() {
  for _ in $(seq 1 6); do
    ts="$(date +%Y%m%d%H%M%S)-$$-$RANDOM"
    path="$BASE_DIR/$SITE_ID/releases/$ts"
    if [ ! -e "$path" ]; then
      mkdir -p "$path"
      chown "$RUN_USER":"$RUN_USER" "$path"
      echo "$path"
      return
    fi
    sleep 1
  done
  echo >&2 "[deploy][$SITE_ID] ERROR: failed to create release dir"; exit 1
}
RELEASE_DIR=$(make_release_dir)
echo "[deploy][$SITE_ID] Release dir: $RELEASE_DIR"

# Read .env
if [ ! -t 0 ]; then
  echo "[deploy][$SITE_ID] Reading .env"
  sudo -u "$RUN_USER" tee "$RELEASE_DIR/.env" >/dev/null
  sudo -u "$RUN_USER" chmod 600 "$RELEASE_DIR/.env" || true
fi

# Clean stale tmp dirs
echo "[deploy][$SITE_ID] Cleaning stale temp dirs"
for d in /tmp/tmp.* /tmp/${SITE_ID}.clone.*; do
  [ -e "$d" ] || continue
  sudo chown -R root:root "$d" 2>/dev/null || true
  sudo chmod -R u+rwx "$d" 2>/dev/null || true
  sudo rm -rf "$d" 2>/dev/null || true
done

# Clone repo
echo "[deploy][$SITE_ID] Cloning repo"
attempts=0
while true; do
  attempts=$((attempts+1))
  TMP_CLONE="/tmp/${SITE_ID}.clone.$$.$RANDOM"
  sudo -u "$RUN_USER" mkdir -p "$TMP_CLONE"
  sudo -u "$RUN_USER" chown "$RUN_USER":"$RUN_USER" "$TMP_CLONE"
  if sudo -u "$RUN_USER" git clone --depth 1 --branch "$BRANCH" "$REPO" "$TMP_CLONE"; then
    break
  fi
  sudo rm -rf "$TMP_CLONE"
  [ "$attempts" -ge 5 ] && { echo "[deploy][$SITE_ID] ERROR: git clone failed"; exit 1; }
  sleep 1
done

# Move files
shopt -s dotglob
for f in "$TMP_CLONE"/*; do
  [ "$(basename "$f")" = ".env" ] && continue
  sudo -u "$RUN_USER" mv "$f" "$RELEASE_DIR/"
done
shopt -u dotglob
sudo rm -rf "$TMP_CLONE"

# Allocate or reuse port
if [ -L "$CURRENT_LINK/.env" ] && grep -q '^PORT=' "$CURRENT_LINK/.env"; then
  ALLOC_PORT=$(grep '^PORT=' "$CURRENT_LINK/.env" | cut -d= -f2)
  echo "[deploy][$SITE_ID] Reusing PORT=$ALLOC_PORT"
else
  count=$(find "$BASE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)
  ALLOC_PORT=$((PORT_BASE + count))
  echo "$ALLOC_PORT" > "$BASE_DIR/$SITE_ID/PORT"
  echo "[deploy][$SITE_ID] Allocated PORT=$ALLOC_PORT"
fi

# Ensure .env entries
{
  grep -q '^PORT=' "$RELEASE_DIR/.env" || echo "PORT=$ALLOC_PORT"
  grep -q '^PUBLIC_SITE_URL=' "$RELEASE_DIR/.env" || echo "PUBLIC_SITE_URL=https://${SITE_ID}.${DOMAIN_BASE}"
} | sudo -u "$RUN_USER" tee -a "$RELEASE_DIR/.env" >/dev/null

# Build
echo "[deploy][$SITE_ID] Building"
sudo -u "$RUN_USER" bash -c "
  set -o allexport
  source '$RELEASE_DIR/.env' || true
  set +o allexport
  cd '$RELEASE_DIR'
  if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent --no-audit --no-fund; fi
  npm run schema:generate || true
  npm run build:all
"

# PM2 ecosystem
ECO="$RELEASE_DIR/ecosystem.config.cjs"
cat > "$ECO" <<EOF
module.exports = {
  apps: [{
    name: "${PM2_PREFIX}${SITE_ID}",
    script: "./dist/server/entry.mjs",
    cwd: "${RELEASE_DIR}",
    instances: 1,
    exec_mode: "fork",
    env: { NODE_ENV: "production", PORT: "${ALLOC_PORT}", HOST: "0.0.0.0" },
    error_file: "/var/log/pm2/${PM2_PREFIX}${SITE_ID}-error.log",
    out_file: "/var/log/pm2/${PM2_PREFIX}${SITE_ID}-out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    max_restarts: 10,
    min_uptime: "10s",
    watch: false,
    env_file: ".env",
    kill_timeout: 5000,
    listen_timeout: 3000,
    restart_delay: 1000
  }]
};
EOF
sudo chown "$RUN_USER":"$RUN_USER" "$ECO"

echo "[deploy][$SITE_ID] Starting PM2"
sudo -u "$RUN_USER" pm2 delete "${PM2_PREFIX}${SITE_ID}" &>/dev/null || true
sudo -u "$RUN_USER" pm2 start "$ECO" --name "${PM2_PREFIX}${SITE_ID}" --update-env
sudo -u "$RUN_USER" pm2 save

# Symlink
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
sudo chown -h "$RUN_USER":"$RUN_USER" "$CURRENT_LINK"

# Update Nginx map
echo "[deploy][$SITE_ID] Updating nginx map"
TMP=$(mktemp)
TMP2="${TMP}.2"

# Read existing host port entries (strip trailing ;)
if [ -f "$NGINX_MAP" ]; then
  awk '/^[[:space:]]*[A-Za-z0-9._-]+[[:space:]]+[0-9]+;/{ gsub(/;$/, "", $2); if($1!="default") print $1" "$2 }' \
    "$NGINX_MAP" | sort -u > "$TMP" || true
else
  echo > "$TMP"
fi

# Remove old entry, append this site
grep -v "^${SITE_ID}\." "$TMP" > "$TMP2" || true
echo "${SITE_ID}.${DOMAIN_BASE} ${ALLOC_PORT}" >> "$TMP2"

# Write final map
{
  echo "# Auto-generated site->port map"
  echo "map \$host \$site_port {"
  echo "  default 3000;"
  sort -k1,1 "$TMP2" | while read -r host port; do
    [ -z "$host" ] && continue
    [ -z "$port" ] && continue
    echo "  $host $port;"
  done
  echo "}"
} | sudo tee "$NGINX_MAP" > /dev/null

rm -f "$TMP" "$TMP2"
# Cleanup
echo "[deploy][$SITE_ID] Cleaning old releases"
cd "$BASE_DIR/$SITE_ID/releases"
ls -1dt */ | tail -n +$((KEEP_RELEASES+1)) | xargs -r rm -rf

# Reload Nginx
echo "[deploy][$SITE_ID] Testing nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "DEPLOY_OK"
echo "url=https://${SITE_ID}.${DOMAIN_BASE}/"
echo "port=${ALLOC_PORT}"