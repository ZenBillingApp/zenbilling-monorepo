# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY lerna.json ./

# Copy shared package
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/prisma ./packages/shared/prisma/
COPY packages/shared/src ./packages/shared/src/
COPY packages/shared/tsconfig.json ./packages/shared/

# Copy company_service package
COPY packages/company_service/package*.json ./packages/company_service/
COPY packages/company_service/src ./packages/company_service/src/
COPY packages/company_service/tsconfig.json ./packages/company_service/

# Install dependencies
RUN npm install

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run prisma:generate
RUN npm run build

# Build the company service
WORKDIR /app/packages/company_service
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy root package files and install workspaces
COPY package*.json ./
COPY lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/company_service/package*.json ./packages/company_service/

# Install only production dependencies for workspaces
RUN npm ci --only=production --workspaces && npm cache clean --force

# Copy built service
COPY --from=builder /app/packages/company_service/dist ./packages/company_service/dist

# Copy built shared package (entire directory)
COPY --from=builder /app/packages/shared ./packages/shared

# Copy the entire generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

WORKDIR /app/packages/company_service
CMD ["node", "dist/app.js"]