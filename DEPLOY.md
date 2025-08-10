# Guide de déploiement Coolify - Zenbilling

## Architecture des microservices

Zenbilling est composé de 11 microservices indépendants :

- **api_gateway** (Port 8080) - Point d'entrée principal
- **auth_service** (Port 3001) - Authentification avec Better Auth
- **company_service** (Port 3002) - Gestion des entreprises
- **stripe_service** (Port 3003) - Paiements Stripe
- **dashboard_service** (Port 3004) - Tableaux de bord
- **invoice_service** (Port 3005) - Gestion des factures
- **quote_service** (Port 3006) - Gestion des devis
- **email_service** (Port 3007) - Envoi d'emails
- **product_service** (Port 3008) - Gestion des produits
- **customer_service** (Port 3009) - Gestion des clients
- **pdf_service** (Port 3010) - Génération de PDF
- **ai_service** (Port 3011) - Fonctionnalités IA

## Variables d'environnement requises

### Variables globales (tous les services)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/zenbilling
```

### Service auth_service (Port 3001)

```bash
PORT=3001
BETTER_AUTH_SECRET=your-very-secure-secret-key-here
BETTER_AUTH_URL=https://auth.yourdomain.com
CLIENT_URL=https://app.yourdomain.com
CLIENT_URL_2=https://api.yourdomain.com
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
COOKIE_DOMAIN=.yourdomain.com
```

### Service stripe_service (Port 3003)

```bash
PORT=3003
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Service email_service (Port 3007)

```bash
PORT=3007
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### Service ai_service (Port 3011)

```bash
PORT=3011
OPENAI_API_KEY=sk-...
```

### Variables pour les autres services

Chaque service nécessite seulement :
```bash
PORT=[port-du-service]
DATABASE_URL=postgresql://user:password@host:5432/zenbilling
```

## Déploiement sur Coolify

### 1. Prérequis

- Instance Coolify configurée
- Accès à un registry Docker (GitHub Container Registry recommandé)
- Base de données PostgreSQL accessible
- Instance Redis (optionnelle, pour les sessions)

### 2. Préparation des images Docker

Pour chaque service, vous devez :

1. **Construire l'image Docker :**
```bash
# Exemple pour auth_service
docker build -f packages/auth_service/Dockerfile -t ghcr.io/your-username/zenbilling-auth-service:latest .
```

2. **Pousser l'image vers le registry :**
```bash
docker push ghcr.io/your-username/zenbilling-auth-service:latest
```

### 3. Configuration dans Coolify

#### Méthode 1 : Interface web

1. Créer un nouveau projet dans Coolify
2. Pour chaque service, créer une nouvelle application
3. Utiliser le type "Docker Image"
4. Spécifier l'image : `ghcr.io/your-username/zenbilling-[service-name]:latest`
5. Configurer les variables d'environnement selon la liste ci-dessus
6. Définir le port d'exposition
7. Configurer le health check sur `/health`

#### Méthode 2 : Configuration JSON

Chaque service a un fichier `coolify.json` dans son répertoire. Vous pouvez :

1. Modifier le fichier `coolify.json` du service
2. Remplacer `your-username` par votre nom d'utilisateur GitHub
3. Importer la configuration dans Coolify

### 4. Ordre de déploiement recommandé

1. **Base de données PostgreSQL** (si pas encore déployée)
2. **auth_service** - Service d'authentification (critique)
3. **Services métier** (ordre indifférent) :
   - company_service
   - customer_service
   - product_service
   - invoice_service
   - quote_service
   - stripe_service
   - email_service
   - pdf_service
   - dashboard_service
   - ai_service
4. **api_gateway** - Point d'entrée (en dernier)

### 5. Configuration réseau

#### Réseau interne Coolify

Tous les services doivent être sur le même réseau `zenbilling-network` pour communiquer entre eux.

#### Domaines et routing

- **API Gateway** : `api.yourdomain.com` (public)
- **Services internes** : Accessible uniquement via le réseau interne
- **Auth Service** : Peut nécessiter un domaine public pour OAuth

### 6. Health checks

Chaque service doit implémenter un endpoint `/health` qui retourne :
- Status code 200 si le service est en bonne santé
- Status code 500+ en cas de problème

### 7. Monitoring et logs

- Activer les logs Coolify pour chaque service
- Configurer des alertes sur les health checks
- Surveiller les métriques de performance

## Scripts de déploiement automatique

### Build et push de toutes les images

```bash
#!/bin/bash

REGISTRY="ghcr.io/your-username"
SERVICES=(
    "api_gateway"
    "auth_service"
    "company_service"
    "customer_service"
    "dashboard_service"
    "email_service"
    "invoice_service"
    "pdf_service"
    "product_service"
    "quote_service"
    "stripe_service"
    "ai_service"
)

for service in "${SERVICES[@]}"; do
    echo "Building $service..."
    docker build -f packages/$service/Dockerfile -t $REGISTRY/zenbilling-$service:latest .
    
    echo "Pushing $service..."
    docker push $REGISTRY/zenbilling-$service:latest
done
```

### Déploiement local avec Docker Compose

```bash
# Créer le fichier .env avec vos variables
cp .env.example .env

# Lancer tous les services
docker-compose up -d

# Vérifier les services
docker-compose ps

# Voir les logs
docker-compose logs -f [service-name]
```

## Troubleshooting

### Service ne démarre pas
1. Vérifier les logs Coolify
2. Vérifier la connectivité à la base de données
3. Vérifier que toutes les variables d'environnement sont définies

### Problèmes de connexion entre services
1. Vérifier que tous les services sont sur le même réseau
2. Utiliser les noms de service Coolify pour les communications internes
3. Vérifier les ports et les health checks

### Problèmes d'authentification
1. Vérifier les domaines CORS dans auth_service
2. Vérifier la configuration des cookies (COOKIE_DOMAIN)
3. Vérifier les clés OAuth Google

## Sécurité

- Utiliser des secrets forts pour BETTER_AUTH_SECRET
- Changer les clés par défaut dans la configuration Express Gateway
- Utiliser HTTPS en production
- Restreindre l'accès aux services internes
- Régulièrement mettre à jour les dépendances