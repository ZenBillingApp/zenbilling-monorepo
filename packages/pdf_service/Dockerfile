# Build stage
FROM node:lts-slim AS builder

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
FROM node:lts-slim

WORKDIR /app

# Install necessary libraries for Puppeteer
RUN apt-get update && apt-get install -y \
    curl \
    libglib2.0-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libxext6 \
    libxfixes3 \
    libxrender1 \
    libxshmfence1 \
    xdg-utils \
    fonts-liberation \
    libxkbcommon0 \
    && rm -rf /var/lib/apt/lists/*

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