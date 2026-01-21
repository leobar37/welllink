# ================================
# MediApp Web - Dockerfile
# Runtime: Bun
# Optimized for Dokploy & SSR Ready
# ================================

# Stage 1: Build the application
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
# In a monorepo, if there's no root lockfile copied, it will generate a new one
# but since it's a single package build, it's fine for now.

# Install all dependencies
RUN bun install

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
# This generates build/client (and build/server if ssr is enabled)
RUN bun run build

# Stage 2: Production with Bun
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Copy built files and server script
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.ts ./

# Install production dependencies only
RUN bun install --production

# Expose port (Dokploy will map this)
EXPOSE 3000

# Health check (matches the /health endpoint in server.ts)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Bun server
CMD ["bun", "run", "server.ts"]
