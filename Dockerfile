ARG NODE_VERSION=18

# Alpine image
FROM node:${NODE_VERSION}-slim AS base
RUN npm install pnpm turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

FROM base as installer
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base as runner
WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY . .

CMD ["pnpm", "ponder", "start"]

