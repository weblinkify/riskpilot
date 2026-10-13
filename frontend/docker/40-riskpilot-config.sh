#!/bin/sh
# Generates env.js + nginx config from API_MODE / BACKEND_URL at container start.
set -eu
MODE="${API_MODE:-mock}"
[ "$MODE" = "real" ] || MODE="mock"
printf 'window.__RISKPILOT_ENV__ = {"apiMode":"%s","apiBaseUrl":""};\n' "$MODE" > /usr/share/nginx/html/env.js

PROXY=""
if [ "$MODE" = "real" ]; then
  PROXY="location ~ ^/(graphql|api/) { proxy_pass ${BACKEND_URL}; proxy_set_header Host \$host; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; client_max_body_size 20m; }"
fi
sed "s@#__API_PROXY__@${PROXY}@" /etc/nginx/riskpilot/nginx.conf.template > /etc/nginx/conf.d/default.conf
echo "riskpilot: API_MODE=${MODE}"
