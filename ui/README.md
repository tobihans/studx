# StudX

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
pnpm build

# Runs the end-to-end tests
pnpm test:e2e
# Runs the tests only on Chromium
pnpm test:e2e --project=chromium
# Runs the tests of a specific file
pnpm test:e2e tests/example.spec.ts
# Runs the tests in debug mode
pnpm test:e2e --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

## Utilities

### Create a virtual microphone

```sh
# Device will be at /tmp/virtmic
pactl load-module module-pipe-source \
    source_name=virtmic file=/tmp/virtmic \
    format=s16le rate=16000 channels=1
```

### Remove virtual microphones

```sh
pactl unload-module module-pipe-source
```

### Play sound to microphone

```sh
# Assuming your file is file.mp3
ffmpeg -re -i file.mp3 -f s16le -ar 16000 -ac 1 - > /tmp/virtmic
```
