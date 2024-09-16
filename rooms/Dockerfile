FROM rust:1.80.0-slim-bullseye AS build

RUN apt-get update && apt-get install -y \
    libssl-dev openssl pkg-config build-essential \
    python3 python3-pip nodejs
RUN rustup component add rustfmt

WORKDIR /build

COPY Cargo.lock Cargo.toml ./
RUN mkdir src \
    && echo "fn main() {}" > src/main.rs \
    &&  cargo build --release && cargo clean -r -p studx

COPY src src
RUN cargo build --locked --release
RUN cp ./target/release/studx /bin/rooms

FROM debian:bullseye-slim AS final

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "10001" \
    appuser
USER appuser

COPY --from=build /bin/rooms /bin/
CMD ["/bin/rooms"]
