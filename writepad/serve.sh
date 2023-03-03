#!/usr/bin/env bash

WRITEPAD_PORT=9090
WRITEPAD_HOST=${STUDX_BASE_IP:-192.168.0.134}:9091
EXEC_SERVER="node server.mjs"
EXEC_PROXY="caddy reverse-proxy --from ${WRITEPAD_HOST:-192.168.0.134:9091} --to localhost:$WRITEPAD_PORT"


tmux new -d -s studx-writepad \; split-window -v ;\
tmux send-keys -t studx-writepad.0 "$EXEC_SERVER" ENTER
tmux send-keys -t studx-writepad.1 "$EXEC_PROXY" ENTER

tmux a -t studx-writepad
