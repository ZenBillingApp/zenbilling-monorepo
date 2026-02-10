# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/pdf_service/package*.json ./packages/pdf_service/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY packages/pdf_service/ ./packages/pdf_service/

WORKDIR /app/packages/shared
RUN npm run prisma:generate && npm run build

WORKDIR /app/packages/pdf_service
RUN npm run build

# ============================================
# Stage 2: Production (requires Chromium for Puppeteer)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install Chromium and dependencies for Puppeteer PDF generation
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/pdf_service/package*.json ./packages/pdf_service/

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/pdf_service/dist ./packages/pdf_service/dist

# Copy Handlebars templates for PDF generation
COPY --from=builder /app/packages/pdf_service/src/templates ./packages/pdf_service/dist/templates

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Fixed: was incorrectly set to 3007 (email_service port)
EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3010/health || exit 1

WORKDIR /app/packages/pdf_service
CMD ["node", "dist/app.js"]
