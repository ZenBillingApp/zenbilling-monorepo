# =============================================================================
# Auth Service - Multi-stage Dockerfile optimisé pour NPM Workspaces + Coolify
# Build context: racine du monorepo
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies (optimisation cache)
# -----------------------------------------------------------------------------
FROM node:20-slim AS deps

WORKDIR /app

# Installer OpenSSL pour Prisma (requis sur slim)
RUN apt-get update && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copier uniquement les package.json pour optimiser le cache Docker
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/auth_service/package.json ./packages/auth_service/

# Installer toutes les dépendances (dev inclus pour le build)
RUN npm ci --workspaces --include-workspace-root

# -----------------------------------------------------------------------------
# Stage 2: Builder (compilation TypeScript + génération Prisma)
# -----------------------------------------------------------------------------
FROM deps AS builder

WORKDIR /app

# Copier le schéma Prisma et générer le client
COPY packages/shared/prisma ./packages/shared/prisma/
RUN npm run prisma:generate --workspace=@zenbilling/shared

# Copier les sources shared et compiler
COPY packages/shared/src ./packages/shared/src/
COPY packages/shared/tsconfig.json ./packages/shared/
RUN npm run build --workspace=@zenbilling/shared

# Copier les sources auth_service et compiler
COPY packages/auth_service/src ./packages/auth_service/src/
COPY packages/auth_service/tsconfig.json ./packages/auth_service/
RUN npm run build --workspace=auth_service

# -----------------------------------------------------------------------------
# Stage 3: Production (image runtime minimale)
# -----------------------------------------------------------------------------
FROM node:20-slim AS production

WORKDIR /app

# Installer OpenSSL pour Prisma runtime + curl pour healthcheck
RUN apt-get update && apt-get install -y openssl curl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copier uniquement les fichiers package
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/auth_service/package.json ./packages/auth_service/

# Installer les dépendances de production uniquement
RUN npm ci --workspaces --include-workspace-root --omit=dev && npm cache clean --force

# Copier les artefacts compilés depuis builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma/
COPY --from=builder /app/packages/auth_service/dist ./packages/auth_service/dist/

# Créer un utilisateur non-root pour la sécurité (USER 1001 évite "unable to find user" en userns)
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs && \
    chown -R 1001:1001 /app

USER 1001

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start", "--workspace=auth_service"]
