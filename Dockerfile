# --- Build des assets (Vite) ---
FROM node:22-alpine AS assets
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# --- Image applicative (PHP-FPM + Nginx) ---
FROM serversideup/php:8.5-fpm-nginx

USER root
RUN install-php-extensions intl
USER www-data

ENV PHP_OPCACHE_ENABLE=1
WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
RUN composer install --no-dev --optimize-autoloader --no-interaction
COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build