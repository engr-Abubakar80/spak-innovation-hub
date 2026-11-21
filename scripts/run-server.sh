#!/usr/bin/env bash
# Keeps PostgreSQL and the Next.js production server running.
# Designed to be executed inside a detached tmux session.
set -u

PROJECT_DIR="/home/engr/Documents/SPAK WEB APP/spak-innovation-hub"
PGBIN="/usr/lib/postgresql/15/bin"
PGDATA="/home/engr/.pgdata"
LOGDIR="/home/engr/.spak-logs"
PGPORT=5433
APP_PORT=3000

mkdir -p "$LOGDIR"
cd "$PROJECT_DIR" || exit 1

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

ensure_postgres() {
  if "$PGBIN/pg_isready" -h 127.0.0.1 -p "$PGPORT" >/dev/null 2>&1; then
    return 0
  fi
  log "PostgreSQL not ready; starting..."
  "$PGBIN/pg_ctl" -D "$PGDATA" \
    -o "-p $PGPORT -c shared_buffers=64MB -c max_connections=30 -k /tmp/opencode -c listen_addresses=127.0.0.1" \
    -l "$LOGDIR/postgres.log" start >/dev/null 2>&1
  for i in $(seq 1 30); do
    if "$PGBIN/pg_isready" -h 127.0.0.1 -p "$PGPORT" >/dev/null 2>&1; then
      log "PostgreSQL is ready."
      return 0
    fi
    sleep 1
  done
  log "WARNING: PostgreSQL did not become ready."
  return 1
}

log "=== SPAK server supervisor started ==="

while true; do
  ensure_postgres

  log "Starting Next.js server on 0.0.0.0:$APP_PORT"
  PORT="$APP_PORT" HOSTNAME=0.0.0.0 NODE_ENV=production \
    "$PROJECT_DIR/node_modules/.bin/next" start -H 0.0.0.0 -p "$APP_PORT" \
    >> "$LOGDIR/next.log" 2>&1
  code=$?
  log "Next.js exited with code $code. Restarting in 3s..."
  sleep 3
done
