# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/customer_service/package*.json ./packages/customer_service/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY packages/customer_service/ ./packages/customer_service/

WORKDIR /app/packages/shared
RUN npm run prisma:generate && npm run build

WORKDIR /app/packages/customer_service
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json lerna.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/customer_service/package*.json ./packages/customer_service/

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/customer_service/dist ./packages/customer_service/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3009/health || exit 1

WORKDIR /app/packages/customer_service
CMD ["node", "dist/app.js"]
