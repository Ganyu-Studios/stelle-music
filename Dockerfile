# syntax=docker/dockerfile:1

# ----------------------------------------------------------------------------
# Builder — install deps and generate the Prisma client. Bun runs the TypeScript sources directly, so there is no compile step.
# ----------------------------------------------------------------------------
FROM oven/bun:1.4.4-slim AS builder

# Prisma's query engine needs OpenSSL; CA certs are needed to fetch it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Skip the husky pre-commit setup during install (no git here).
ENV HUSKY=0
# A placeholder is enough for `prisma generate` — it never connects to the DB at build time.
ENV DATABASE_URL="mongodb://placeholder:27017/stelle"

WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes.
# package.json carries `trustedDependencies` (the Prisma packages), the only ones allowed to run install scripts.
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

# Copy the rest of the source.
COPY . .

# Generate the Prisma client into src/generated (downloads the Linux query engine; does NOT touch the DB).
RUN bun run db:generate

# Keep only the production dependencies for a smaller runtime image.
RUN rm -rf node_modules \
    && bun install --frozen-lockfile --production --ignore-scripts

# ----------------------------------------------------------------------------
# Runner — the lean image that actually runs the bot.
# ----------------------------------------------------------------------------
FROM oven/bun:1.4.4-slim AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

# Run as a non-root user (uid/gid 1001, so existing cache/log volumes stay writable).
RUN groupadd -g 1001 stelle \
    && useradd -m -u 1001 -g stelle stelle

# Copy only what the runtime needs: the sources (with the generated Prisma client), and
# tsconfig.json, whose `paths` are how Bun resolves the `#stelle/*` imports.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/package.json /app/tsconfig.json /app/seyfert.config.ts ./

# Runtime data directories (mounted as volumes in docker-compose).
RUN mkdir -p /app/logs /app/cache \
    && chown -R stelle:stelle /app

USER stelle

CMD ["bun", "src/index.ts"]
