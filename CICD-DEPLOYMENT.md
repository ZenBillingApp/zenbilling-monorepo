# Guide CI/CD et Déploiement - Zenbilling Monorepo

## 🎯 Vue d'ensemble

Ce guide détaille comment configurer et utiliser les workflows GitHub Actions pour automatiser le build, les tests et le déploiement de votre monorepo Zenbilling sur Coolify.

## 📋 Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Workflows disponibles](#workflows-disponibles)
3. [Variables et secrets](#variables-et-secrets)
4. [Utilisation des workflows](#utilisation-des-workflows)
5. [Déploiement sur Coolify](#déploiement-sur-coolify)
6. [Maintenance](#maintenance)

---

## 🔧 Configuration initiale

### 1. Personnaliser les configurations

**Remplacer les placeholders par votre nom d'utilisateur GitHub :**

```bash
# Exécuter le script de mise à jour
./scripts/update-coolify-configs.sh VOTRE_USERNAME_GITHUB

# Exemple
./scripts/update-coolify-configs.sh john-doe
```

### 2. Activer les GitHub Actions

1. Aller dans votre repository GitHub
2. Onglet **Actions** > **I understand my workflows**
3. Les workflows seront automatiquement détectés

### 3. Permissions GitHub Container Registry

```bash
# Configurer les permissions du token GitHub
# Aller dans Settings > Developer settings > Personal access tokens
# Ou utiliser le GITHUB_TOKEN automatique (recommandé)
```

---

## 🤖 Workflows disponibles

### 1. **Build and Deploy** (`build-and-deploy.yml`)

**Déclenchement automatique :**
- Push sur `main` ou `develop`
- Pull Request vers `main`
- Modification de fichiers dans `packages/`

**Fonctionnalités :**
- ✅ Détection automatique des services modifiés
- ✅ Build conditionnel (seulement les services changés)
- ✅ Support multi-architecture (AMD64 + ARM64)
- ✅ Cache Docker pour builds rapides
- ✅ Déploiement automatique sur `main`

**Matrice de build intelligente :**
```yaml
# Si packages/shared/ change → rebuild tous les services
# Si packages/auth_service/ change → rebuild auth_service seulement
# Si plusieurs services changent → rebuild en parallèle
```

### 2. **Manual Service Build** (`manual-service-build.yml`)

**Utilisation :**
- Actions tab > "Manual Service Build" > "Run workflow"
- Sélectionner le service spécifique
- Choisir le tag personnalisé
- Option push/no-push

**Cas d'usage :**
- Test d'un service spécifique
- Création de tags de release
- Debug de problèmes de build

### 3. **PR Validation** (`pr-validation.yml`)

**Déclenchement :**
- Ouverture/modification de Pull Request

**Validations :**
- ✅ TypeScript compilation
- ✅ Build des services modifiés
- ✅ Test de construction Docker
- ✅ Commentaire automatique avec résumé

### 4. **Cleanup Registry** (`cleanup-registry.yml`)

**Déclenchement :**
- Planifié : Dimanche 2h00 UTC
- Manuel avec options

**Fonctionnalités :**
- 🧹 Supprime les anciennes images Docker
- ⚙️ Configurable (nombre d'images à garder)
- 🔍 Mode dry-run disponible

---

## 🔐 Variables et secrets

### Variables d'environnement GitHub

| Variable | Description | Valeur |
|----------|-------------|---------|
| `GITHUB_TOKEN` | Token automatique GitHub | Auto-généré |
| `REGISTRY` | Registry Docker | `ghcr.io` |
| `IMAGE_PREFIX` | Préfixe des images | `zenbilling` |

### Secrets optionnels

| Secret | Description | Requis |
|--------|-------------|--------|
| `COOLIFY_TOKEN` | Token API Coolify | Pour déploiement auto |
| `COOLIFY_ENDPOINT` | URL de votre instance Coolify | Pour déploiement auto |

**Configuration dans GitHub :**
`Settings` > `Secrets and variables` > `Actions` > `New repository secret`

---

## 🚀 Utilisation des workflows

### Scénario 1 : Développement normal

```bash
# 1. Développer localement
git checkout -b feature/new-invoice-feature

# 2. Modifier des fichiers
# packages/invoice_service/src/...

# 3. Créer une Pull Request
git add .
git commit -m "feat(invoice): add new feature"
git push origin feature/new-invoice-feature

# 4. Le workflow PR Validation se déclenche automatiquement
# - Compile TypeScript
# - Build Docker
# - Commente la PR avec le résumé
```

### Scénario 2 : Release en production

```bash
# 1. Merger la PR vers main
# 2. Le workflow Build and Deploy se déclenche :
#    - Build les images modifiées
#    - Tag avec 'latest' et SHA du commit
#    - Push vers ghcr.io
#    - Déclenche le déploiement Coolify (si configuré)
```

### Scénario 3 : Build manuel d'urgence

```bash
# 1. Aller dans GitHub > Actions
# 2. Sélectionner "Manual Service Build"
# 3. Choisir le service (ex: auth_service)
# 4. Tag personnalisé (ex: hotfix-v1.2.1)
# 5. ✅ Push image
```

### Scénario 4 : Modification du shared package

```bash
# Si packages/shared/ est modifié :
# → Tous les services seront automatiquement rebuildés
# → Garantit la cohérence entre services
```

---

## 🏗️ Déploiement sur Coolify

### Option 1 : Déploiement automatique (recommandé)

**Configuration requise :**

```bash
# Secrets GitHub à ajouter
COOLIFY_TOKEN=your-coolify-api-token
COOLIFY_ENDPOINT=https://your-coolify-instance.com
```

**Processus automatique :**
1. Push sur `main` déclenche le build
2. Images poussées vers GitHub Container Registry  
3. API Coolify appelée pour redéployer
4. Services mis à jour automatiquement

### Option 2 : Déploiement manuel

**1. Build local des images :**
```bash
# Construire toutes les images
./scripts/build-all-images.sh -u VOTRE_USERNAME --push

# Ou construire un service spécifique
./scripts/build-all-images.sh -u VOTRE_USERNAME --push -t v1.2.3
```

**2. Configuration Coolify :**
- Créer une application par service
- Source : Docker Image
- Image : `ghcr.io/VOTRE_USERNAME/zenbilling-SERVICE:latest`
- Variables d'environnement selon `coolify.json`
- Health check : `/health`
- Réseau : `zenbilling-network`

**3. Ordre de déploiement :**
```
1. Infrastructure (PostgreSQL, Redis)
2. auth_service (port 3001)
3. Services métier (ports 3002-3011)
4. api_gateway (port 8080)
```

---

## 🛠️ Maintenance

### Nettoyage des images

```bash
# Automatique : Chaque dimanche 2h00 UTC
# Manuel dans GitHub Actions :
# "Cleanup Registry" > "Run workflow" > Configuration
```

### Monitoring des builds

**Indicateurs à surveiller :**
- ⏱️ Temps de build par service
- 📦 Taille des images Docker
- 🚨 Échecs de build récurrents
- 💾 Utilisation du cache

### Mise à jour des dépendances

**Dependabot configuré pour :**
- 📅 Mises à jour hebdomadaires
- 📦 Par service (répartition dans la semaine)
- 👥 Review automatique assignée
- 📝 Messages de commit standardisés

### Troubleshooting courant

**Build échoue après modification du shared :**
```bash
# Vérifier que shared se build correctement
cd packages/shared
npm run build
```

**Permission denied sur GitHub Container Registry :**
```bash
# Vérifier les permissions du GITHUB_TOKEN
# Settings > Actions > General > Workflow permissions
# ✅ Read and write permissions
```

**Service non détecté comme modifié :**
```bash
# Vérifier les patterns dans detect-changes
# Le workflow regarde les paths: 'packages/**'
```

---

## 📈 Métriques et optimisations

### Build times typiques

| Service | Build time | Image size |
|---------|------------|------------|
| shared | ~30s | - |
| auth_service | ~2min | ~150MB |
| api_gateway | ~1min | ~100MB |
| Services métier | ~1min30 | ~140MB |

### Optimisations appliquées

- ✅ **Cache Docker multi-layer** : Réduction 60% du temps
- ✅ **Build parallèle** : Matrix strategy
- ✅ **Build conditionnel** : Seulement services modifiés
- ✅ **Multi-architecture** : AMD64 + ARM64 support

---

## 🎯 Prochaines étapes

1. **Configurer les secrets Coolify** pour le déploiement automatique
2. **Tester le workflow complet** avec une petite modification  
3. **Monitorer les premières exécutions** et ajuster si nécessaire
4. **Documenter les procédures spécifiques** à votre équipe

---

**📞 Support :** Les workflows sont configurés pour être robustes, mais n'hésitez pas à adapter selon vos besoins spécifiques.