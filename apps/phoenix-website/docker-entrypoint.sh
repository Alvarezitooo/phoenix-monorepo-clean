#!/bin/bash
set -e

echo "=== Website Starting ==="
echo "Using hardcoded port 8080"

# Copy template to final config (no substitution needed)
cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf

# Remove the template file to avoid conflicts
rm -f /etc/nginx/conf.d/default.conf.template

echo "Nginx config ready - starting nginx..."
# Start nginx
exec "$@"