# ============================================
# API Gateway - No build step (plain JS)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

# Copy workspace config + gateway package.json
COPY package*.json lerna.json ./
COPY packages/api_gateway/package*.json ./packages/api_gateway/

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy gateway application files
COPY packages/api_gateway/server.js ./packages/api_gateway/
COPY packages/api_gateway/config/ ./packages/api_gateway/config/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

WORKDIR /app/packages/api_gateway
CMD ["node", "server.js"]
