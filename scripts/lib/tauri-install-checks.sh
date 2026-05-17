#!/usr/bin/env bash

new_logs_since_line() {
  local log_path="$1"
  local from_line="$2"
  if [[ ! -f "$log_path" ]]; then
    return 0
  fi
  tail -n +"$((from_line + 1))" "$log_path" 2>/dev/null || true
}

wait_for_log_marker() {
  local log_path="$1"
  local timeout_seconds="$2"
  local marker="$3"
  local start_line="${4:-0}"

  local start_epoch
  start_epoch="$(date +%s)"

  while true; do
    local new_logs
    new_logs="$(new_logs_since_line "$log_path" "$start_line")"
    if [[ "$new_logs" == *"$marker"* ]]; then
      return 0
    fi

    local now elapsed
    now="$(date +%s)"
    elapsed=$((now - start_epoch))
    if (( elapsed >= timeout_seconds )); then
      return 1
    fi
    sleep 1
  done
}
