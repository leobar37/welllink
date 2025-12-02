# ================================
# Wellness Link API - Dockerfile
# Runtime: Bun + Elysia
# Optimized for Dokploy
# ================================

# Single stage build (simpler, more compatible)
FROM oven/bun:1 AS production

WORKDIR /app

# Environment variables BEFORE build (so bun can inline them)
ENV NODE_ENV=production
ENV PORT=5300

# Copy package files
COPY package.json ./

# Install all dependencies
RUN bun install

# Copy source code
COPY . .

# Create uploads directory for local storage
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 5300

# No health check (let Dokploy handle it)
# Run source directly with bun (no build step - more reliable)
CMD ["bun", "run", "src/index.ts"]
