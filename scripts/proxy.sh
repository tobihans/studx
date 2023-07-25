#!/usr/bin/env bash

# TODO: Resolve the SSL issue that prevents the proxy from working

set -euo pipefail

CADDYFILE=${1:-$PWD/Caddyfile}
CADDY_VERSION="caddy:2.6.3-alpine"

ENVIRONMENT=$(sed -e 's/export //g' -e '/^#/d' -e '/^$/d' .env | tr '\n' ' ')
DOCKER_ENV=$(sed -e 's/export /-e /g' -e '/^#/d' -e '/^$/d' .env | tr '\n' ' ')

CMD="$ENVIRONMENT docker run --rm -it --network host $DOCKER_ENV -v $CADDYFILE:/etc/caddy/Caddyfile $CADDY_VERSION"

bash -c "$CMD"
