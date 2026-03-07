# ================================
# MediApp API - Dockerfile
# Runtime: Bun + Elysia
# Optimized for Dokploy with Doppler
# ================================

FROM oven/bun:1

# Install Doppler CLI and curl for healthchecks
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    && curl -sLf --retry 3 --tlsv1.2 --proto "=https" "https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key" | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list \
    && apt-get update && apt-get install -y doppler \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && doppler --version

WORKDIR /app

# Copy package files and pre-installed node_modules (from workspace)
COPY package.json bun.lock ./
COPY node_modules ./node_modules

# Copy source code and config
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

# Create uploads directory for local storage
RUN mkdir -p /app/uploads

# Create entrypoint script for flexible command execution
RUN echo '#!/bin/sh' > /usr/local/bin/entrypoint.sh && \
    echo 'set -e' >> /usr/local/bin/entrypoint.sh && \
    echo '' >> /usr/local/bin/entrypoint.sh && \
    echo 'if [ $# -gt 0 ]; then' >> /usr/local/bin/entrypoint.sh && \
    echo '  if [ -n "$DOPPLER_TOKEN" ]; then' >> /usr/local/bin/entrypoint.sh && \
    echo '    exec doppler run -- "$@"' >> /usr/local/bin/entrypoint.sh && \
    echo '  else' >> /usr/local/bin/entrypoint.sh && \
    echo '    exec "$@"' >> /usr/local/bin/entrypoint.sh && \
    echo '  fi' >> /usr/local/bin/entrypoint.sh && \
    echo 'fi' >> /usr/local/bin/entrypoint.sh && \
    echo '' >> /usr/local/bin/entrypoint.sh && \
    echo 'if [ -n "$DOPPLER_TOKEN" ]; then' >> /usr/local/bin/entrypoint.sh && \
    echo '  exec doppler run -- bun run src/index.ts' >> /usr/local/bin/entrypoint.sh && \
    echo 'else' >> /usr/local/bin/entrypoint.sh && \
    echo '  exec bun run src/index.ts' >> /usr/local/bin/entrypoint.sh && \
    echo 'fi' >> /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production \
    PORT=5300

EXPOSE 5300

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:5300/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
