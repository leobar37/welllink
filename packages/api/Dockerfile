# ================================
# Wellness Link API - Dockerfile
# Runtime: Bun + Elysia
# ================================

# Stage 1: Install dependencies
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Stage 2: Build
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Stage 3: Production
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 elysia

# Copy built application and production dependencies
COPY --from=deps --chown=elysia:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=elysia:nodejs /app/dist ./dist
COPY --from=builder --chown=elysia:nodejs /app/package.json ./

# Copy Drizzle migrations (needed for db:migrate if used)
COPY --from=builder --chown=elysia:nodejs /app/src/db/migrations ./src/db/migrations
COPY --from=builder --chown=elysia:nodejs /app/drizzle.config.ts ./

# Create uploads directory for local storage
RUN mkdir -p /app/uploads && chown -R elysia:nodejs /app/uploads

# Switch to non-root user
USER elysia

# Expose port (Railway assigns dynamically via $PORT)
EXPOSE 5300

# Environment variables (override at runtime)
ENV NODE_ENV=production

# Health check using dynamic port
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun --eval "fetch('http://localhost:' + (process.env.PORT || 5300) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["bun", "run", "dist/index.js"]
