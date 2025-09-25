# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS base
ENV NODE_ENV=development
ENV NUXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
RUN corepack enable && corepack prepare yarn@4.5.0 --activate && yarn install --immutable

FROM node:22-alpine AS builder
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/yarn.lock ./yarn.lock
COPY . .
RUN corepack enable && corepack prepare yarn@4.5.0 --activate && yarn build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/yarn.lock ./yarn.lock
COPY --from=base /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=base /app/.yarn ./ .yarn
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
