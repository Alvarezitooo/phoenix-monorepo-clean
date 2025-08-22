#!/bin/bash
set -e

# Substitute environment variables in nginx template
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Remove the template file to avoid conflicts
rm -f /etc/nginx/conf.d/default.conf.template

# Start nginx
exec "$@"