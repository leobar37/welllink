# ================================
# Wellness Link API - Dockerfile
# Runtime: Bun + Elysia
# Optimized for Dokploy
# ================================

# Single stage build (simpler, more compatible)
FROM oven/bun:1 AS production

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Create uploads directory for local storage
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 5300

# Environment variables
ENV NODE_ENV=production
ENV PORT=5300

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5300}/api/health || exit 1

# Start the application
CMD ["bun", "run", "dist/index.js"]
