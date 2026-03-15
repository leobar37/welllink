#!/bin/bash
set -e

echo "=== CitaBot Mission Initialization ==="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/api" ] || [ ! -d "packages/web" ]; then
    echo "Error: Must run from repo root with packages/api and packages/web"
    exit 1
fi

# Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    bun install
fi

# Ensure API dependencies
if [ ! -d "packages/api/node_modules" ]; then
    echo "Installing API dependencies..."
    cd packages/api && bun install && cd ../..
fi

# Ensure web dependencies
if [ ! -d "packages/web/node_modules" ]; then
    echo "Installing web dependencies..."
    cd packages/web && bun install && cd ../..
fi

# Check environment files
if [ ! -f "packages/api/.env" ]; then
    echo "Warning: packages/api/.env not found. Copy from .env.example if available."
fi

if [ ! -f "packages/web/.env" ]; then
    echo "Warning: packages/web/.env not found. Copy from .env.example if available."
fi

# Verify database connection
echo "Checking PostgreSQL..."
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "PostgreSQL is running on localhost:5432"
else
    echo "Warning: PostgreSQL not available on localhost:5432"
    echo "Start with: docker compose up -d postgres"
fi

echo "=== Initialization Complete ==="
echo ""
echo "Next steps:"
echo "  1. Start services: docker compose up -d postgres"
echo "  2. Run migrations: bun run db:migrate"
echo "  3. Start dev servers: bun run dev"
