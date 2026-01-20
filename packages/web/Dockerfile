# ================================
# MediApp Web - Dockerfile
# Runtime: Bun (builder) + Nginx (production)
# Optimized for Dokploy
# ================================

# ================================
# Stage 1: Build the application
# ================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including devDependencies for build)
RUN bun install

# Copy source code
COPY . .

# Build argument for API URL (can be overridden by Dokploy)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
# This generates static files in .react-router/client
RUN bun run build

# ================================
# Stage 2: Production with Nginx
# ================================
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
# React Router v7 builds to build/client by default
COPY --from=builder /app/build/client /usr/share/nginx/html

# Expose port (Dokploy will map this)
EXPOSE 3000

# Health check (optional, Dokploy can handle this externally)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
