#!/usr/bin/env bash

set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

COMPOSE=(docker compose -f compose.prod.yaml)

if [[ ! -d .git ]]; then
    echo "Error: deploy.sh must run from a Git checkout." >&2
    exit 1
fi

if [[ ! -f .env ]]; then
    echo "Error: .env is required for the production Compose configuration." >&2
    exit 1
fi

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    echo "Error: Docker Compose is not available." >&2
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running or this user cannot access the Docker daemon." >&2
    exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: tracked files have local changes. Commit or discard them before deploying." >&2
    exit 1
fi

echo "Checking production Compose configuration..."
"${COMPOSE[@]}" config --quiet

echo "Pulling the current branch..."
git pull --ff-only

echo "Validating the updated production Compose configuration..."
"${COMPOSE[@]}" config --quiet

echo "Building the application and Caddy images..."
"${COMPOSE[@]}" build app caddy

echo "Starting the database and Redis..."
"${COMPOSE[@]}" up -d mariadb redis

echo "Running database migrations..."
"${COMPOSE[@]}" run --rm app php artisan migrate --force

echo "Starting the updated production services..."
"${COMPOSE[@]}" up -d --remove-orphans

echo "Rebuilding Laravel caches..."
"${COMPOSE[@]}" exec -T app php artisan optimize

echo "Deployment completed successfully."
