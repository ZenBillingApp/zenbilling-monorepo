# Guide de Configuration CI/CD Production

## 🚀 Configuration Coolify Required

### 1. GitHub Secrets à Configurer

Dans votre repository GitHub, ajoutez ces secrets :

```bash
# URL de base de vos webhooks Coolify (sans le nom du service)
COOLIFY_WEBHOOK_URL_PREFIX=https://your-coolify-domain/webhooks/deploy/your-project-

# URL de base de votre application en production (pour health checks)
COOLIFY_BASE_URL=https://your-production-domain.com
```

### 2. Webhooks Coolify par Service

Chaque service doit avoir son webhook dans Coolify :
- `api_gateway` → `COOLIFY_WEBHOOK_URL_PREFIX`api_gateway
- `auth_service` → `COOLIFY_WEBHOOK_URL_PREFIX`auth_service
- `ai_service` → `COOLIFY_WEBHOOK_URL_PREFIX`ai_service
- etc.

### 3. Images Docker Attendues

Les services Coolify doivent pointer vers :
```
ghcr.io/zenbillingapp/zenbilling-SERVICE_NAME:latest
```

## 🔧 Pipeline Production Features

### ✅ Smart Change Detection
- Détecte automatiquement les services modifiés
- Skip les services non modifiés pour économiser les ressources
- Force deploy disponible via workflow dispatch

### ✅ Strict Pipeline Order
1. **Build** → Compilation TypeScript + cache des artifacts
2. **Test** → Tests unitaires/intégration avec PostgreSQL/Redis
3. **Security** → Audit npm + scan des secrets
4. **Push** → Build Docker + push vers GHCR avec cache
5. **Deploy** → Webhook Coolify + attente entre déploiements
6. **Health Check** → Vérification de tous les endpoints
7. **Cleanup** → Nettoyage post-déploiement

### ✅ Production Safety
- **Fail-fast**: Arrêt immédiat en cas d'erreur critique
- **No continue-on-error**: Validation stricte
- **Timeouts**: Protection contre les jobs qui traînent
- **Retries**: Mécanisme de retry pour les déploiements
- **Security Scan**: Vérification des secrets et vulnérabilités

### ✅ Emergency Rollback
```bash
# Rollback d'un service spécifique
gh workflow run rollback.yml -f services="auth_service"

# Rollback complet
gh workflow run rollback.yml -f services="all"

# Rollback vers un commit spécifique
gh workflow run rollback.yml -f services="all" -f target_sha="abc123"
```

## 🏥 Health Check Endpoints

La pipeline attend ces endpoints :

| Service | Health Check URL |
|---------|------------------|
| API Gateway | `BASE_URL/` |
| Autres services | `BASE_URL/api/SERVICE_NAME/health` |

## 🔄 Workflow Triggers

### Production Pipeline (`production.yml`)
- **Auto**: Push sur `main`
- **Manuel**: Workflow dispatch avec option force deploy
- **Conditions**: Seuls les services modifiés sont déployés

### Development Pipeline (`development.yml`)
- **Auto**: Push sur `develop`, `feature/*`
- **PR**: Vers `develop` ou `main`
- **Scope**: Tests rapides + validation TypeScript

### Rollback Pipeline (`rollback.yml`)
- **Manuel seulement**: Workflow dispatch
- **Options**: Services spécifiques ou rollback complet
- **Safety**: Vérifie l'existence des images avant rollback

## 📊 Monitoring & Debugging

### Logs à Surveiller
1. **GitHub Actions**: Logs détaillés pour chaque étape
2. **Coolify**: Status des déploiements via webhooks
3. **Health Checks**: Vérification automatique post-déploiement

### Troubleshooting Commun

#### Échec de Health Check
```bash
# Vérifier manuellement
curl -f https://your-domain.com/api/auth_service/health

# Vérifier les logs Coolify
# → Logs → Service spécifique
```

#### Échec de Build Docker
- Vérifier les Dockerfiles des services
- S'assurer que les artifacts de build sont présents

#### Webhook Coolify Non Déclenché
- Vérifier les secrets GitHub
- Tester les URLs de webhooks manuellement

#### Rollback Impossible
- L'image Docker du commit cible doit exister dans GHCR
- Format attendu: `ghcr.io/zenbillingapp/zenbilling-SERVICE:main-SHA`

## 🎯 Bonnes Pratiques

### Avant le Merge vers Main
1. ✅ Tests passent sur la branche de développement
2. ✅ PR review complétée
3. ✅ Health checks locaux OK avec `docker-compose up`

### En Production
1. 🔍 Monitorer les logs GitHub Actions
2. ⏱️ Attendre la completion des health checks
3. 📊 Vérifier le monitoring applicatif
4. 🚨 Rollback immédiat si problème détecté

### Sécurité
- 🔒 Jamais de secrets en dur dans le code
- 🛡️ Variables d'environnement via Coolify
- 🔐 Images Docker taguées et versionées
- 📋 Audit des dépendances NPM activé