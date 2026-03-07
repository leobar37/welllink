# ================================
# MediApp Web - Dockerfile
# Runtime: Bun
# Optimized for Dokploy with Pre-built Assets
# ================================

FROM oven/bun:1

WORKDIR /app

# Copy package files and pre-installed node_modules (from workspace)
COPY package.json bun.lock ./
COPY node_modules ./node_modules

# Copy built assets (build should be done in CI before docker build)
COPY build ./build
COPY public ./public

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:3000/health || exit 1

CMD ["bun", "x", "serve", "-l", "3000", "./build/client/index.html"]
