# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspaces
COPY package*.json ./
COPY lerna.json ./

# Copy all package.json files
COPY packages/shared/package*.json ./packages/shared/
COPY packages/ai_service/package*.json ./packages/ai_service/

# Install dependencies with workspaces
RUN npm install

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY packages/ai_service/ ./packages/ai_service/

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run prisma:generate
RUN npm run build

# Build the service
WORKDIR /app/packages/ai_service
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy root package files for workspaces
COPY package*.json ./
COPY lerna.json ./

# Copy package.json files
COPY packages/shared/package*.json ./packages/shared/
COPY packages/ai_service/package*.json ./packages/ai_service/

# Install only production dependencies with workspaces
RUN npm ci --only=production --workspaces

# Copy built service
COPY --from=builder /app/packages/ai_service/dist ./packages/ai_service/dist

# Copy built shared package and install it properly
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy the entire generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create symbolic link or copy shared package to node_modules
RUN mkdir -p node_modules/@zenbilling && \
    ln -sf /app/packages/shared node_modules/@zenbilling/shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3011/health || exit 1

WORKDIR /app/packages/ai_service
CMD ["node", "dist/app.js"]

