# Dockerfile pour service auth indépendant
FROM node:18-alpine AS builder

WORKDIR /app

# Copier le package shared pour la compilation
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src/ ./packages/shared/src/
COPY packages/shared/prisma/ ./packages/shared/prisma/

# Build du package shared d'abord
WORKDIR /app/packages/shared
RUN npm install && npm run prisma:generate && npm run build

# Revenir au service auth
WORKDIR /app/packages/auth_service

# Copier les fichiers du service auth
COPY packages/auth_service/package*.json ./
COPY packages/auth_service/tsconfig.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY packages/auth_service/src/ ./src/

# Build du service (inclut le build du shared package si nécessaire)
RUN npm run build

# Stage final minimal
FROM node:18-alpine

WORKDIR /app/packages/auth_service

# Copier seulement les fichiers nécessaires à l'exécution
COPY --from=builder /app/packages/auth_service/dist ./dist
COPY --from=builder /app/packages/auth_service/node_modules ./node_modules
COPY --from=builder /app/packages/auth_service/package.json ./package.json
COPY --from=builder /app/packages/shared/dist ./node_modules/@zenbilling/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@zenbilling/shared/package.json

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

# Health check pour Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/app.js"]