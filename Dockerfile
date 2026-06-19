# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies against the lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Build the Nuxt app -> produces a self-contained Nitro server in .output/
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    # Outbound IP -> geo enrichment (set to false for fully local operation)
    NUXT_GEO_LOOKUP=true
    # Public base URL for generated tracking links — set at runtime, e.g.
    #   -e NUXT_PUBLIC_BASE_URL=https://badger.example.com

# The Nitro output bundles everything it needs; no node_modules required.
COPY --from=build /app/.output ./.output

# Writable, persistable data directory (file-based trap/hit storage).
# The path matches the storage base baked in at build time (/app/.data).
RUN mkdir -p /app/.data && chown -R node:node /app
USER node

VOLUME ["/app/.data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/traps" >/dev/null 2>&1 || exit 1

CMD ["node", ".output/server/index.mjs"]
