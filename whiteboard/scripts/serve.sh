#!/usr/bin/env bash

WHITEBOARD_HOST=${STUDX_BASE_IP:-192.168.0.134}:8081

docker compose up -d && \
  caddy reverse-proxy --from "${WHITEBOARD_HOST:-0.0.0.0:8081}" \
  --to "$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' studx_whiteboard):8080" \
  --change-host-header
