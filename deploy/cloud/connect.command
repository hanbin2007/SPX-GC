#!/bin/bash
set -e

ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:5658:127.0.0.1:5658 root@39.108.109.86 &
tunnel=$!
trap 'kill "$tunnel" 2>/dev/null || true; wait "$tunnel" 2>/dev/null || true' EXIT INT TERM

for attempt in {1..30}; do
  if curl -fsS --max-time 1 -o /dev/null http://127.0.0.1:5658/login; then
    open http://127.0.0.1:5658/
    wait "$tunnel"
    exit $?
  fi
  if ! kill -0 "$tunnel" 2>/dev/null; then
    wait "$tunnel"
    exit 1
  fi
  sleep 0.2
done

echo 'Could not connect to the cloud controller.' >&2
exit 1
