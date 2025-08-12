FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration depuis le contexte du monorepo
COPY packages/api_gateway/package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier les fichiers de l'application
COPY packages/api_gateway/server.js ./
COPY packages/api_gateway/config/ ./config/

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]