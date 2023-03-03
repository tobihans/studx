# Do not remove this block. It is used by the 'help' rule when
# constructing the help output.
# help:
# help: StudX Makefile
# help:

SHELL := bash

.PHONY: help
# help: help - See all available targets
help:
	@grep "^# help:" Makefile | sed 's/\# help\: //' | sed 's/\# help\://'

.PHONY: install
# help: install - Attempts to install necessary dependencies for all sub projects
install:
	@./scripts/install.sh

.PHONY: up 
# help: up - Starts external services (Postgres, Redis, ...)
up:
	@docker compose up -d

.PHONY: down 
# help: down - Take down external services (Postgres, Redis, ...)
down:
	@docker compose down

