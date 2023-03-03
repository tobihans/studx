#!/usr/bin/env bash

tmux new -d -s studx-dev \; split-window -v
tmux send-keys -t studx-dev.0 "$(tr '\n' ' ' < .env) caddy run" ENTER
tmux send-keys -t studx-dev.1 "$(tr '\n' ' ' < .env) npx vite --host" ENTER

tmux a -t studx-dev
