# ================================
# MediApp API - Dockerfile
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

# Install curl and gnupg for Doppler CLI download
RUN apt-get update && apt-get install -y curl gnupg

# Install Doppler CLI for environment variable injection
RUN curl -Ls https://cli.doppler.com/install.sh | sh

# Copy source code
COPY . .

# Create uploads directory for local storage
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 5300

# No health check (let Dokploy handle it)
# Run with Doppler to inject environment variables
CMD ["doppler", "run", "--", "bun", "run", "src/index.ts"]
