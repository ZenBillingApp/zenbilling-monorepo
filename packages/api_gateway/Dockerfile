# Production image for Express Gateway
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy root package files and install workspaces
COPY package*.json ./
COPY lerna.json ./
COPY packages/api_gateway/package*.json ./packages/api_gateway/

# Install only production dependencies for workspaces
RUN npm ci --only=production --workspaces && npm cache clean --force

# Copy application files
COPY packages/api_gateway/server.js ./packages/api_gateway/
COPY packages/api_gateway/config/ ./packages/api_gateway/config/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

WORKDIR /app/packages/api_gateway
CMD ["node", "server.js"]