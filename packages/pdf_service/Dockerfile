# =============================================================================
# PDF Service - Multi-stage Dockerfile avec Puppeteer/Chromium pour Coolify
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
COPY packages/pdf_service/package.json ./packages/pdf_service/

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

# Copier les sources pdf_service et compiler
COPY packages/pdf_service/src ./packages/pdf_service/src/
COPY packages/pdf_service/tsconfig.json ./packages/pdf_service/
RUN npm run build --workspace=pdf_service

# -----------------------------------------------------------------------------
# Stage 3: Production (image runtime avec Chromium pour Puppeteer)
# -----------------------------------------------------------------------------
FROM node:20-slim AS production

WORKDIR /app

# Installer les dépendances système pour Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurer Puppeteer pour utiliser Chromium installé
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copier uniquement les fichiers package
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/pdf_service/package.json ./packages/pdf_service/

# Installer les dépendances de production uniquement
RUN npm ci --workspaces --include-workspace-root --omit=dev && npm cache clean --force

# Copier les artefacts compilés depuis builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/prisma ./packages/shared/prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma/
COPY --from=builder /app/packages/pdf_service/dist ./packages/pdf_service/dist/

# Copier les templates Handlebars
COPY packages/pdf_service/src/templates ./packages/pdf_service/dist/templates/

# Créer un utilisateur non-root pour la sécurité
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production
ENV PORT=3010

EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3010/health || exit 1

CMD ["npm", "start", "--workspace=pdf_service"]
