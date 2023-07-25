# StudX
A prototype of audio-conferencing software for virtual classes.

This is my end of study project.
You can find the source code of the associated report [here](https://github.com/tobihans/end-of-study-report.git).

> This branch contains the unified version of the project which originally was spread across many repositories.
> They are now archived (and private). And this repository tracks the development.

## Development
The development setup is, by default, tailored for Linux. But you can get it running on any other system,
provided you make the manual changes where necessary.

### Dependencies
This is a non exhaustive list of dependencies you'll need:

- Caddy installed on the system ; (or with docker `docker run -it --rm --name studx-proxy --network host -v ./Caddyfile:/etc/caddy/Caddyfile caddy:2.6.3-alpine`)
- Node.JS >= 16 ;
- Rust 1.6x ;
- Python >= 3.10 ;
- Kitty terminal (optional).

### Install & build dependencies
The command below will perform all the necessary steps to get your app dependencies installed.
Be sure to customize the `.env` file once it's done.

```bash
make setup
```

### Start app
If you use kitty, you can use the session file provided to start all the necessary services.

```bash
make dev
```

In case you're not a Kitty fan, you can start every service manually. Look at the session file 
to see what commands to run.

### Load sample data
There is a basic fixture available to populate the API DB.
To load it, run:

```bash
cd api/
poetry run -- ./manage.py loaddata fixtures/base.json
```

### Project Tree
```text
.
├── api # API
├── Caddyfile.template # template from which Caddyfile is created after being populated
├── docker-compose.yml
├── env.template
├── kitty.conf # kitty session file
├── Makefile
├── README.md
├── rooms # rust project for rooms
├── scripts # bash utilities
├── ui # app frontend
├── whiteboard # app whiteboard
└── writepad # app writepad
```

### Issues

- **Caddy** proxy: `Permission denied`
Use `sudo setcap CAP_NET_BIND_SERVICE=+eip $(which caddy)` to enable access to low-level ports.
