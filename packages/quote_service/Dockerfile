# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build shared package first
COPY packages/shared/package*.json ./packages/shared/
WORKDIR /app/packages/shared
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY packages/shared/tsconfig.json ./
COPY packages/shared/src/ ./src/
COPY packages/shared/prisma/ ./prisma/
RUN npm run prisma:generate
RUN npm run build

# Build the service
WORKDIR /app
COPY packages/quote_service/package*.json ./packages/quote_service/
COPY packages/quote_service/tsconfig.json ./packages/quote_service/
WORKDIR /app/packages/quote_service
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY packages/quote_service/src/ ./src/
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy service package.json and install production deps
COPY packages/quote_service/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi && npm cache clean --force

# Copy built service
COPY --from=builder /app/packages/quote_service/dist ./dist

# Copy built shared package
COPY --from=builder /app/packages/shared/dist ./node_modules/@zenbilling/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@zenbilling/shared/package.json
COPY --from=builder /app/packages/shared/node_modules/@prisma/client ./node_modules/@prisma/client

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

CMD ["node", "dist/app.js"]
