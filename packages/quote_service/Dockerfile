# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/quote_service/package*.json ./packages/quote_service/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY packages/quote_service/ ./packages/quote_service/

WORKDIR /app/packages/shared
RUN npm run prisma:generate && npm run build

WORKDIR /app/packages/quote_service
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/quote_service/package*.json ./packages/quote_service/

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/quote_service/dist ./packages/quote_service/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

WORKDIR /app/packages/quote_service
CMD ["node", "dist/app.js"]
