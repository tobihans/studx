up:
	@docker compose up -d

down:
	@docker compose down

dev:
	@tmux new -d -s studx-api \; split-window -v ;
	@tmux send-keys -t studx-api.0 "poetry run -- celery -A core worker" ENTER
	@tmux send-keys -t studx-api.1 "poetry run -- ./manage.py runserver 0.0.0.0:6000" ENTER
	@tmux a -t studx-api

code:
	@poetry run -- nvim

shell:
	@DEBUG=true poetry run -- ./manage.py shell_plus

