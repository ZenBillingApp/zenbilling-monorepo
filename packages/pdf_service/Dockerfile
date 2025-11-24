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

# Copy pdf_service package
COPY packages/pdf_service/package*.json ./packages/pdf_service/
COPY packages/pdf_service/src ./packages/pdf_service/src/
COPY packages/pdf_service/tsconfig.json ./packages/pdf_service/

# Install dependencies
RUN npm install

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run prisma:generate
RUN npm run build

# Build the pdf service
WORKDIR /app/packages/pdf_service
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Puppeteer on Alpine
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy root package files and install workspaces
COPY package*.json ./
COPY lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/pdf_service/package*.json ./packages/pdf_service/

# Install only production dependencies for workspaces
RUN npm ci --only=production --workspaces && npm cache clean --force

# Copy built service
COPY --from=builder /app/packages/pdf_service/dist ./packages/pdf_service/dist

# Copy templates directory
COPY --from=builder /app/packages/pdf_service/src/templates ./packages/pdf_service/dist/templates

# Copy built shared package (entire directory)
COPY --from=builder /app/packages/shared ./packages/shared

# Copy the entire generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3007/health || exit 1

WORKDIR /app/packages/pdf_service
CMD ["node", "dist/app.js"]