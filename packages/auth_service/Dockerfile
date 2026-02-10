# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace config (cached layer)
COPY package*.json lerna.json ./

# Copy only the package.json files needed for dependency resolution
COPY packages/shared/package*.json ./packages/shared/
COPY packages/auth_service/package*.json ./packages/auth_service/

# Install all dependencies (dev included for build)
RUN npm ci

# Copy source files
COPY packages/shared/ ./packages/shared/
COPY packages/auth_service/ ./packages/auth_service/

# Build shared package first (Prisma + TypeScript)
WORKDIR /app/packages/shared
RUN npm run prisma:generate && npm run build

# Build the auth service
WORKDIR /app/packages/auth_service
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy workspace config + package.json for prod install
COPY package*.json lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/auth_service/package*.json ./packages/auth_service/

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy built auth service
COPY --from=builder /app/packages/auth_service/dist ./packages/auth_service/dist

# Copy Prisma generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

WORKDIR /app/packages/auth_service
CMD ["node", "dist/app.js"]
