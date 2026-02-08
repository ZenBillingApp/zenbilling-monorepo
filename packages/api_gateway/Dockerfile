# =============================================================================
# API Gateway - Dockerfile optimisé pour Express Gateway + Coolify
# Build context: racine du monorepo
# =============================================================================

FROM node:20-slim AS production

WORKDIR /app

# Installer curl pour healthcheck
RUN apt-get update && apt-get install -y curl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copier les fichiers package pour installation des workspaces
COPY package.json package-lock.json lerna.json ./
COPY packages/api_gateway/package.json ./packages/api_gateway/

# Installer les dépendances de production uniquement
RUN npm ci --workspaces --include-workspace-root --omit=dev && npm cache clean --force

# Copier les fichiers de l'application Gateway
COPY packages/api_gateway/server.js ./packages/api_gateway/
COPY packages/api_gateway/config/ ./packages/api_gateway/config/
COPY packages/api_gateway/plugins/ ./packages/api_gateway/plugins/

# Créer un utilisateur non-root pour la sécurité (USER 1001 évite "unable to find user" en userns)
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs && \
    chown -R 1001:1001 /app

USER 1001

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["npm", "start", "--workspace=api_gateway"]
