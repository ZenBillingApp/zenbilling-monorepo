# Guide CI/CD - Déploiement Coolify

## Configuration des Secrets GitHub

### 1. Aller dans les paramètres de votre repository GitHub

**Settings → Secrets and Variables → Actions**

### 2. Ajouter les secrets suivants

#### Secrets pour Coolify Staging
- `COOLIFY_TOKEN` : Token API de votre instance Coolify de staging
- `COOLIFY_URL` : URL de votre instance Coolify de staging (ex: https://coolify.yourdomain.com)

#### Secrets pour Coolify Production
- `COOLIFY_PROD_TOKEN` : Token API de votre instance Coolify de production  
- `COOLIFY_PROD_URL` : URL de votre instance Coolify de production

### 3. Comment obtenir les tokens Coolify

1. Connectez-vous à votre instance Coolify
2. Allez dans **Settings → API Keys**
3. Créez une nouvelle API Key
4. Copiez le token généré

## Workflows disponibles

### 1. Déploiement automatique (`deploy.yml`)

**Déclenchement :**
- Push sur `main` → Déploiement en production
- Push sur `develop` → Déploiement en staging  
- Changements dans `packages/` uniquement

**Déploiement manuel :**
```bash
# Via l'interface GitHub Actions
Actions → Deploy to Coolify → Run workflow
```

**Options disponibles :**
- **Services** : Spécifier quels services déployer (ou "all")
- **Environment** : Choisir staging ou production

### 2. Release de production (`release.yml`)

**Déclenchement :**
- Création d'un tag git commençant par `v` (ex: v1.0.0)

**Processus :**
1. Build et push des images Docker avec le numéro de version
2. Déploiement automatique en production
3. Création d'une release GitHub

**Créer une release :**
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Structure des images Docker

### Registry utilisé
- **GitHub Container Registry** : `ghcr.io`
- **Format** : `ghcr.io/[username]/zenbilling-[service]:[tag]`

### Tags automatiques
- `main` branch → `latest`
- `develop` branch → `develop-[sha]`
- Tags git → Version exacte (ex: `v1.0.0`)

### Services déployés
- `api_gateway` (Port 8080)
- `auth_service` (Port 3001)
- `company_service` (Port 3002)
- `customer_service` (Port 3009)
- `dashboard_service` (Port 3004)
- `email_service` (Port 3007)
- `invoice_service` (Port 3005)
- `pdf_service` (Port 3010)
- `product_service` (Port 3008)
- `quote_service` (Port 3006)
- `stripe_service` (Port 3003)
- `ai_service` (Port 3011)

## Configuration Coolify requise

### 1. Créer les applications dans Coolify

Pour chaque service, créer une application avec :
- **Type** : Docker Image
- **Image** : `ghcr.io/[username]/zenbilling-[service]:latest`
- **Port** : Port correspondant au service
- **Nom** : `zenbilling-[service]` (staging) ou `zenbilling-[service]-prod` (production)

### 2. Configurer les variables d'environnement

Voir le fichier `.env.example` pour la liste complète.

### 3. Configurer les health checks

Chaque service doit répondre sur `/health` avec un status 200.

## Utilisation

### Déploiement de développement

1. **Push sur develop** → Déploiement automatique en staging
```bash
git push origin develop
```

2. **Déploiement manuel de services spécifiques**
```bash
# Via GitHub Actions interface
Services: "auth_service,api_gateway"
Environment: staging
```

### Déploiement de production

1. **Push sur main** → Déploiement automatique en production
```bash
git checkout main
git merge develop
git push origin main
```

2. **Release avec tag**
```bash
git tag v1.0.0
git push origin v1.0.0
# → Déploiement automatique + création release GitHub
```

### Détection des changements

Le système détecte automatiquement :
- Changements dans `packages/[service]/` → Déploie ce service uniquement
- Changements dans `packages/shared/` → Déploie tous les services
- Déploiement manuel → Déploie les services spécifiés

## Monitoring et logs

### Vérifier le déploiement
1. Aller dans **GitHub Actions** pour voir le statut
2. Vérifier les logs Coolify pour chaque service
3. Tester les endpoints de santé : `https://service.domain.com/health`

### En cas d'échec
1. Vérifier les logs GitHub Actions
2. Vérifier les secrets GitHub sont corrects
3. Vérifier la configuration Coolify
4. Vérifier que les images Docker sont bien pushées

## Sécurité

- Les tokens Coolify sont stockés comme secrets GitHub
- Seuls les collaborateurs du repo peuvent déclencher les déploiements
- L'environnement production nécessite une approbation (configurable)
- Images Docker signées et hashées automatiquement

## Migration depuis le déploiement manuel

1. Supprimer l'ancien script `deploy.sh` si nécessaire
2. Configurer les secrets GitHub
3. Configurer les applications Coolify
4. Tester le déploiement sur une branche de test
5. Migrer les déploiements vers les workflows