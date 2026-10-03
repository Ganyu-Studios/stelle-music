# syntax=docker/dockerfile:1

# ----------------------------------------------------------------------------
# Builder — install deps, generate the Prisma client, and compile to dist/.
# ----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

# Prisma's query engine needs OpenSSL; CA certs are needed to fetch it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Skip the husky pre-commit setup during install (no git here).
ENV HUSKY=0
# A placeholder is enough for `prisma generate` — it never connects to the DB at build time.
ENV DATABASE_URL="mongodb://placeholder:27017/stelle"

RUN corepack enable

WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes.
# pnpm-workspace.yaml carries `allowBuilds` (prisma/esbuild), without which pnpm 10 aborts on ignored build scripts.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source.
COPY . .

# 1. Generate the Prisma client (downloads the Linux query engine; does NOT touch the DB).
# 2. Compile TypeScript to dist/.
# 3. Copy the native query engine next to the compiled client — `tsc` doesn't copy `.node` files.
RUN pnpm db:generate \
    && pnpm build \
    && cp src/generated/prisma/*.node dist/generated/prisma/

# Drop dev dependencies for a smaller runtime image.
RUN pnpm prune --prod --ignore-scripts

# ----------------------------------------------------------------------------
# Runner — the lean image that actually runs the bot.
# ----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

# Run as a non-root user.
RUN groupadd -g 1001 nodejs \
    && useradd -m -u 1001 -g nodejs stelle

# Copy only what the runtime needs.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/seyfert.config.mjs ./seyfert.config.mjs

# Runtime data directories (mounted as volumes in docker-compose).
RUN mkdir -p /app/logs /app/cache \
    && chown -R stelle:nodejs /app

USER stelle

CMD ["node", "dist/index.js"]
