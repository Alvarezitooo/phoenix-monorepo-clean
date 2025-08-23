# 🚀 Phoenix Website - Production Docker Image  
# Sprint 5 - React/Vite with Stripe integration
# Force rebuild v2 - Simple nginx config

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

# Copy nginx template and entrypoint script
COPY nginx/default.conf.template /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Make entrypoint executable
RUN chmod +x /docker-entrypoint.sh

# Set default PORT environment variable
ENV PORT=8080

# Note: Running as root for Railway compatibility

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE 8080

# Use entrypoint for proper template substitution
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]