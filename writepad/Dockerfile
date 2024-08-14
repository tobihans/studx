FROM node:20 AS base

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY ./package*.json ./
RUN npm install

COPY ./server.mjs ./
COPY ./rollup.config.mjs ./
RUN npm run build

#####################
# Final image
#####################

FROM node:20-alpine
ENV NODE_ENV=prod

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY --from=base /opt/app/writepad-server.js ./

EXPOSE 9090
CMD ["node", "writepad-server.js"]

