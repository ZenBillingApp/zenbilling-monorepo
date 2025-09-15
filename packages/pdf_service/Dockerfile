# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace setup
COPY package*.json ./
COPY lerna.json ./

# Copy all packages for workspace resolution
COPY packages/ ./packages/

# Install all dependencies using workspaces
RUN npm install

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run prisma:generate
RUN npm run build

# Build the pdf service
WORKDIR /app/packages/pdf_service
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
COPY packages/pdf_service/package*.json ./packages/pdf_service/

# Install only production dependencies for workspaces
RUN npm ci --only=production --workspaces && npm cache clean --force

# Copy built service
COPY --from=builder /app/packages/pdf_service/dist ./packages/pdf_service/dist

# Copy built shared package (entire directory)
COPY --from=builder /app/packages/shared ./packages/shared

# Copy the entire generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3010/health || exit 1

WORKDIR /app/packages/pdf_service
CMD ["node", "dist/app.js"]