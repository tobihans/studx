FROM node:18-alpine AS build-stage

WORKDIR /app

COPY package.json .

RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm build

FROM caddy:2.8.4-alpine AS web-server

COPY --from=build-stage /app/dist /app/dist
