# Do not remove this block. It is used by the 'help' rule.
# help: StudX Makefile
# help:

SHELL := bash

.PHONY: help
# help: help - See all available targets.
help:
	@grep "^# help:" Makefile | sed 's/\# help\: //' | sed 's/\# help\://'

.PHONY: install-deps
# help: install-deps - Attempts to install necessary dependencies for all sub projects.
install-deps:
	@./scripts/install-deps.sh

.PHONY: up 
# help: up - Starts external services (Postgres, Redis, ...).
up:
	@docker compose up -d

.PHONY: down 
# help: down - Take down external services (Postgres, Redis, ...).
down:
	@docker compose down

.PHONY: setup 
# help: setup - Setup all for development.
setup: install-deps up
	@[[ ! -f .env ]] && cp env.template .env
	@exit 0

.PHONY: caddyfile 
# help: caddyfile - Generate a Caddyfile on the template, replacing env vars properly substituted.
caddyfile:
	@bash -c "source .env && envsubst < Caddyfile.template > Caddyfile"

