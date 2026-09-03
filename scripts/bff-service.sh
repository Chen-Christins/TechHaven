#!/usr/bin/env bash
# TechHaven BFF 身份桥进程管理（无 root 版本；结构与 agent-gateway-service.sh 同构）
set -euo pipefail

ACTION="${1:-}"
ROOT="${2:-}"

if [[ -z "$ACTION" || -z "$ROOT" ]]; then
  echo "Usage: $0 <start|stop|restart|status|health> <absolute-deploy-root>" >&2
  exit 2
fi

if [[ "$ROOT" != /* || "$ROOT" == "/" ]]; then
  echo "Deploy root must be a non-root absolute path: $ROOT" >&2
  exit 2
fi

CURRENT="$ROOT/current/services/techhaven-bff"
SHARED="$ROOT/shared"
ENV_FILE="$SHARED/bff.env"
PID_FILE="$SHARED/bff.pid"
LOG_FILE="$SHARED/bff.log"
ENTRY="$CURRENT/dist/index.js"

mkdir -p "$SHARED"

read_pid() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid="$(tr -d '[:space:]' < "$PID_FILE")"
  [[ "$pid" =~ ^[1-9][0-9]*$ ]] || return 1
  printf '%s' "$pid"
}

is_expected_process() {
  local pid="$1"
  [[ -r "/proc/$pid/cmdline" ]] || return 1
  local command_line
  command_line="$(tr '\0' ' ' < "/proc/$pid/cmdline")"
  [[ "$command_line" == *"$ENTRY"* ]]
}

start_bff() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing server-only environment file: $ENV_FILE" >&2
    echo "Create it from services/techhaven-bff/.env.example and chmod 600 it." >&2
    exit 1
  fi
  if [[ ! -f "$ENTRY" ]]; then
    echo "Missing deployed BFF entry: $ENTRY" >&2
    exit 1
  fi
  local existing
  if existing="$(read_pid)" && kill -0 "$existing" 2>/dev/null; then
    if is_expected_process "$existing"; then
      echo "BFF is already running (pid=$existing)"
      return
    fi
    echo "Refusing to reuse pid $existing: it is not this BFF" >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  : "${TECHHAVEN_API_BASE:?TECHHAVEN_API_BASE is required in $ENV_FILE}"

  local node_bin
  node_bin="$(command -v node)"
  cd "$CURRENT"
  nohup "$node_bin" "$ENTRY" >> "$LOG_FILE" 2>&1 &
  local pid=$!
  printf '%s\n' "$pid" > "$PID_FILE"
  sleep 1
  if ! kill -0 "$pid" 2>/dev/null || ! is_expected_process "$pid"; then
    echo "BFF failed to stay running; inspect $LOG_FILE" >&2
    exit 1
  fi
  echo "BFF started (pid=$pid)"
}

stop_bff() {
  local pid
  if ! pid="$(read_pid)"; then
    echo "BFF is not running (no valid pid file)"
    return
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "Removed stale pid file"
    return
  fi
  if ! is_expected_process "$pid"; then
    echo "Refusing to stop pid $pid: it is not this BFF" >&2
    exit 1
  fi
  kill "$pid"
  for _ in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      echo "BFF stopped"
      return
    fi
    sleep 0.5
  done
  echo "BFF did not stop within 10 seconds" >&2
  exit 1
}

bff_port() {
  local port=3092
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
    port="${TECHHAVEN_BFF_PORT:-3092}"
  fi
  printf '%s' "$port"
}

health_bff() {
  local port
  port="$(bff_port)"
  curl --fail --silent --show-error "http://127.0.0.1:$port/healthz"
  printf '\n'
}

case "$ACTION" in
  start)
    start_bff
    ;;
  stop)
    stop_bff
    ;;
  restart)
    stop_bff
    start_bff
    ;;
  status)
    pid="$(read_pid || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && is_expected_process "$pid"; then
      echo "BFF is running (pid=$pid)"
    else
      echo "BFF is not running"
      exit 1
    fi
    ;;
  health)
    health_bff
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    exit 2
    ;;
esac
