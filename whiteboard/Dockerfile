FROM node:16 as base

# Create app directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

# Install app dependencies
COPY ./package.json pnpm-lock.yaml ./
RUN npm i -g pnpm
RUN pnpm i

# Bundle frontend
COPY src ./src
COPY assets ./assets
COPY config ./config
RUN pnpm build

#####################
# Final image
#####################

FROM node:16-alpine
ENV NODE_ENV=prod

MAINTAINER cracker0dks

# Create app directory
RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY ./package.json ./pnpm-lock.yaml config.default.yml ./
RUN npm i -g pnpm
RUN pnpm i --prod

COPY scripts ./scripts
COPY --from=base /opt/app/dist ./dist

EXPOSE 8080
ENTRYPOINT ["pnpm", "start"]
