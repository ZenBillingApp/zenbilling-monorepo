# Guide de Déploiement ZenBilling

Ce guide détaille le processus de déploiement de ZenBilling sur Coolify self-hosted.

## 🏗️ Architecture CI/CD

### Workflows GitHub Actions

1. **`tests.yml`** - Tests et qualité du code
   - Tests unitaires et d'intégration
   - Vérification TypeScript
   - Déclenchement : Push/PR sur main/develop

2. **`ci.yml`** - Pipeline principal CI/CD
   - Détection des changements par service
   - Build et tests
   - Construction des images Docker
   - Publication sur GitHub Container Registry (ghcr.io)
   - Déclenchement automatique du déploiement

3. **`deploy.yml`** - Déploiement Coolify
   - Déploiement automatique après succès du CI
   - Déploiement manuel via workflow dispatch
   - Health checks post-déploiement

## 🚀 Configuration Initiale

### 1. Prérequis

- Repository GitHub avec actions activées
- Instance Coolify self-hosted fonctionnelle
- Accès admin à votre instance Coolify

### 2. Configuration Coolify

1. **Exécuter le script de configuration** :
   ```bash
   ./scripts/setup-coolify.sh
   ```

2. **Créer les applications Coolify** :
   Pour chaque service, créer une nouvelle application dans Coolify :
   - Type : Docker Image
   - Image : `ghcr.io/VOTRE_USERNAME/zenbilling-SERVICE_NAME:latest`
   - Port : Selon le fichier `coolify.json` du service
   - Réseau : `zenbilling-network`

3. **Configurer les variables d'environnement** :
   Copier les variables depuis les fichiers `coolify.json` de chaque service.

### 3. Secrets GitHub Actions

Ajouter les secrets suivants dans GitHub Repository Settings > Secrets and variables > Actions :

#### Secrets Obligatoires
```bash
COOLIFY_WEBHOOK_URL_PREFIX    # https://votre-coolify.com/api/v1/webhooks/
COOLIFY_BASE_URL             # https://votre-coolify.com
```

#### Secrets par Service (Optionnel pour déploiements ciblés)
```bash
COOLIFY_WEBHOOK_URL_PREFIX-api_gateway
COOLIFY_WEBHOOK_URL_PREFIX-auth_service
COOLIFY_WEBHOOK_URL_PREFIX-ai_service
# ... etc pour chaque service
```

## 📦 Images Docker

### Registre
- **Registry** : GitHub Container Registry (ghcr.io)
- **Format** : `ghcr.io/USERNAME/zenbilling-SERVICE:latest`
- **Authentification** : Token GitHub automatique

### Build Process
- Images construites automatiquement lors des push sur `main`
- Build multi-stage pour optimiser la taille
- Détection intelligente des changements (seuls les services modifiés sont rebuildés)

## 🔄 Processus de Déploiement

### Déploiement Automatique
1. Push sur la branche `main`
2. Tests exécutés (`tests.yml`)
3. Si tests OK → Build images (`ci.yml`)
4. Si build OK → Déploiement Coolify (`deploy.yml`)
5. Health checks des services

### Déploiement Manuel
1. Aller sur GitHub Actions
2. Sélectionner "Deploy to Coolify"
3. Cliquer "Run workflow"
4. Spécifier les services à déployer (ou "all")

## 🌐 Configuration Réseau

### Services et Ports
| Service | Port | Route API Gateway |
|---------|------|------------------|
| api_gateway | 8080 | `/` |
| auth_service | 3001 | `/api/auth/*` |
| ai_service | 3011 | `/api/ai/*` |
| company_service | 3002 | `/api/company/*` |
| customer_service | 3009 | `/api/customer/*` |
| dashboard_service | 3004 | `/api/dashboard/*` |
| email_service | 3007 | `/api/email/*` |
| invoice_service | 3005 | `/api/invoice/*` |
| pdf_service | 3010 | `/api/pdf/*` |
| product_service | 3008 | `/api/product/*` |
| quote_service | 3006 | `/api/quote/*` |
| stripe_service | 3003 | `/api/stripe/*` |

### Health Checks
- **Path** : `/health` (sauf api_gateway : `/`)
- **Interval** : 30s
- **Timeout** : 10s
- **Retries** : 3

## 🔧 Variables d'Environnement

### Variables Communes
```bash
NODE_ENV=production
PORT=SERVICE_SPECIFIC_PORT
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
```

### Variables Spécifiques

#### auth_service
```bash
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-domain.com
CLIENT_URL=https://your-frontend.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
COOKIE_DOMAIN=your-domain.com
```

#### stripe_service
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### ai_service
```bash
OPENAI_API_KEY=sk-...
```

#### email_service
```bash
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## 🔍 Monitoring et Debug

### Logs
- **GitHub Actions** : Consulter les logs des workflows
- **Coolify** : Dashboard > Applications > Logs
- **Services** : Logs disponibles dans `packages/SERVICE/logs/`

### Health Checks
```bash
# Vérifier l'état des services
curl https://your-domain.com/api/auth/health
curl https://your-domain.com/api/ai/health
# ... etc
```

### Debug Déploiement
1. Vérifier les logs GitHub Actions
2. Vérifier les webhooks Coolify
3. Contrôler les variables d'environnement
4. Vérifier la connectivité réseau
5. Consulter les logs des containers

## 🚨 Dépannage

### Problèmes Courants

#### Images Docker non trouvées
- Vérifier que le repository est public ou que Coolify a accès à GHCR
- Contrôler les noms d'images dans coolify.json

#### Variables d'environnement manquantes
- Vérifier la configuration Coolify de chaque service
- S'assurer que tous les secrets sont définis

#### Services qui ne démarrent pas
- Vérifier les logs du container dans Coolify
- Contrôler les dépendances (DB, Redis)
- Vérifier la connectivité réseau

#### Webhooks qui échouent
- Vérifier les URLs de webhook dans les secrets GitHub
- Contrôler les permissions Coolify
- Vérifier la connectivité depuis GitHub vers Coolify

## 📚 Ressources

- [Documentation Coolify](https://coolify.io/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)