#!/bin/bash
set -e

# Debug: Show environment variables
echo "=== ENTRYPOINT DEBUG ==="
echo "PORT environment variable: ${PORT}"
echo "All environment variables:"
env | grep -E "(PORT|RAILWAY)" || echo "No PORT/RAILWAY vars found"

# Set default port if not provided by Railway
export PORT=${PORT:-8080}
echo "Using PORT: ${PORT}"

# Substitute environment variables in nginx template
echo "Substituting template..."
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Debug: Show generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

# Remove the template file to avoid conflicts
rm -f /etc/nginx/conf.d/default.conf.template

echo "Starting nginx..."
# Start nginx
exec "$@"