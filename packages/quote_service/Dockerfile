FROM node:18-alpine AS builder

WORKDIR /app

# Copier le package shared pour la compilation
COPY packages/shared/ ./packages/shared/

# Build du package shared d'abord
WORKDIR /app/packages/shared
RUN npm ci && npm run build

# Revenir à la racine
WORKDIR /app

# Copier les fichiers du service quote
COPY packages/quote_service/package*.json ./packages/quote_service/
COPY packages/quote_service/tsconfig.json ./packages/quote_service/

# Installer les dépendances
WORKDIR /app/packages/quote_service
RUN npm ci --only=production

# Copier le code source
COPY packages/quote_service/src/ ./src/

# Build du service
RUN npm run build

# Stage final
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers construits
COPY --from=builder /app/packages/quote_service/dist ./dist
COPY --from=builder /app/packages/quote_service/node_modules ./node_modules
COPY --from=builder /app/packages/quote_service/package.json ./package.json
COPY --from=builder /app/packages/shared/dist ./node_modules/@zenbilling/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@zenbilling/shared/package.json

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3006

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3006/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/app.js"]