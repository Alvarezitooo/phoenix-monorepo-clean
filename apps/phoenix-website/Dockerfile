# 🚀 Phoenix Website - Production Docker Image
# Sprint 5 - React/Vite with Stripe integration

# Multi-stage build for optimized production image
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; fi

# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV VITE_APP_ENV=production

# Build the application
RUN npm run build

# Production runner stage
FROM nginx:alpine AS runner

# Install curl for health checks and gettext for envsubst
RUN apk add --no-cache curl gettext

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config template for SPA routing
COPY <<EOF /etc/nginx/conf.d/default.conf.template
server {
    listen \${PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA routing - try files then fallback to index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security - block access to sensitive files
    location ~ /\. {
        deny all;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Note: Running as root for Railway compatibility

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-80}/health || exit 1

# Expose port
EXPOSE $PORT

# Start script with PORT substitution
CMD ["sh", "-c", "envsubst '\\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]