# ============================================
# API Gateway - No build step (plain JS)
# ============================================
# syntax=docker/dockerfile:1

FROM node:20-alpine AS production

WORKDIR /app

# Copy workspace config + gateway package.json
COPY package*.json lerna.json ./
COPY packages/api_gateway/package*.json ./packages/api_gateway/

# Install production dependencies only with BuildKit cache
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

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
  CMD wget -qO- http://localhost:8080/health || exit 1

WORKDIR /app/packages/api_gateway
CMD ["node", "server.js"]
