# 💰 ZenBilling

**Plateforme SaaS de facturation et gestion commerciale moderne**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ZenBillingApp/zenbilling-monorepo)
[![Node.js](https://img.shields.io/badge/node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-ISC-yellow.svg)](LICENSE)

ZenBilling est une solution complète de facturation conçue pour les PME et entrepreneurs, offrant une expérience utilisateur moderne avec une architecture microservices robuste.

## 🌟 Fonctionnalités

### 🏢 Gestion d'Entreprise
- **Informations légales** : SIRET, RCS, TVA intracommunautaire
- **Configuration complète** : Adresse, contact, logo
- **Multi-entreprises** : Gestion de plusieurs entités

### 👥 Gestion Clients
- **Clients particuliers** : Nom, prénom, coordonnées
- **Clients professionnels** : SIRET, TVA, informations légales
- **Historique complet** : Factures, devis, paiements

### 📦 Catalogue Produits
- **Gestion avancée** : Prix HT, taux TVA, unités
- **IA intégrée** : Génération automatique de descriptions via OpenAI
- **Organisation** : Catégories et recherche

### 📄 Facturation
- **Devis professionnels** : Création, envoi, suivi
- **Factures** : Génération automatique, numérotation
- **PDF de qualité** : Templates personnalisables
- **Envoi automatique** : Email avec PDF attaché

### 💳 Paiements
- **Stripe Connect** : Acceptation paiements en ligne
- **Liens de paiement** : Génération automatique
- **Suivi** : Statuts et historique des paiements

### 📊 Analytics
- **Dashboard temps réel** : CA, factures, statistiques
- **Reporting** : Export comptable format FEC
- **Métriques** : Suivi des performances

## 🏗️ Architecture Technique

### Microservices (12 services)
```
┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Auth Service   │
│     (8080)      │    │     (3001)      │
└─────────────────┘    └─────────────────┘
         │                       │
    ┌────────────────────────────────┐
    │                                │
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│Company  │  │Customer │  │Product  │  │Invoice  │
│ (3002)  │  │ (3009)  │  │ (3008)  │  │ (3005)  │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Quote   │  │ Email   │  │  PDF    │  │   AI    │
│ (3006)  │  │ (3007)  │  │ (3010)  │  │ (3011)  │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
┌─────────┐  ┌─────────┐
│Dashboard│  │ Stripe  │
│ (3004)  │  │ (3003)  │
└─────────┘  └─────────┘
```

### Stack Technique
- **Backend** : Node.js 20 + TypeScript 5.9
- **Framework** : Express.js avec middlewares sécurisés
- **Base de données** : PostgreSQL 15 + Prisma ORM
- **Cache** : Redis 7 pour sessions et performances
- **Authentification** : Better Auth avec Google OAuth
- **Tests** : Jest avec couverture >80%
- **CI/CD** : GitHub Actions + Docker
- **Déploiement** : Coolify self-hosted
- **Monitoring** : Umami Analytics + Coolify

## 🚀 Installation

### Prérequis
- **Node.js** 20.x ou supérieur
- **Docker** & Docker Compose
- **Git**
- **PostgreSQL** 15+ (ou via Docker)
- **Redis** 7+ (ou via Docker)

### 1. Clonage du projet
```bash
git clone https://github.com/ZenBillingApp/zenbilling-monorepo.git
cd zenbilling-monorepo
```

### 2. Installation des dépendances
```bash
# Installation globale
npm install

# Installation workspaces
npm run dev
```

### 3. Configuration environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables (voir section Configuration)
nano .env
```

### 4. Services avec Docker
```bash
# Démarrage infrastructure (PostgreSQL + Redis)
docker-compose up postgres redis -d

# Ou démarrage complet
docker-compose up -d
```

### 5. Base de données
```bash
# Migration Prisma
cd packages/shared
npm run prisma:migrate

# Génération client
npm run prisma:generate
```

### 6. Démarrage développement
```bash
# Tous les services
npm run dev

# Service spécifique
cd packages/auth_service
npm run dev
```

## ⚙️ Configuration

### Variables d'environnement essentielles

```env
# Base de données
DATABASE_URL=postgresql://zenbilling:zenbilling_password@localhost:5432/zenbilling

# Authentification
BETTER_AUTH_SECRET=your-secret-key-32-chars-minimum
BETTER_AUTH_URL=http://localhost:3001
CLIENT_URL=http://localhost:3000
CLIENT_URL_2=http://localhost:8080

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe Connect
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI (génération descriptions)
OPENAI_API_KEY=sk-...

# Email (Brevo)
BREVO_API_KEY=xkeysib-...

# Redis
REDIS_URL=redis://localhost:6379
```

### Ports des services
| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8080 | Point d'entrée principal |
| Auth Service | 3001 | Authentification |
| Company Service | 3002 | Gestion entreprises |
| Stripe Service | 3003 | Paiements |
| Dashboard Service | 3004 | Analytics |
| Invoice Service | 3005 | Facturation |
| Quote Service | 3006 | Devis |
| Email Service | 3007 | Notifications |
| Product Service | 3008 | Catalogue |
| Customer Service | 3009 | Clients |
| PDF Service | 3010 | Génération PDF |
| AI Service | 3011 | Intelligence artificielle |

## 🔧 Développement

### Commandes principales
```bash
# Développement tous services
npm run dev

# Build tous services
npm run build

# Tests
npm test                    # Tous services
npm run test:coverage       # Avec couverture
cd packages/auth_service    # Service spécifique
npm test

# Base de données
npm run prisma:generate     # Génération client
npm run prisma:migrate      # Migrations dev
npm run prisma:studio       # Interface graphique
```

### Structure des services
```
packages/
├── shared/                 # Package partagé
│   ├── src/
│   │   ├── interfaces/     # Types TypeScript
│   │   ├── middlewares/    # Middlewares communs
│   │   ├── utils/          # Utilitaires
│   │   └── validations/    # Schémas Joi
│   └── prisma/
│       └── schema.prisma   # Schéma BDD
├── auth_service/
├── company_service/
├── customer_service/
└── ...                     # Autres services
```

### Tests
Chaque service incluent :
- **Tests unitaires** : Controllers, Services, Routes
- **Tests d'intégration** : APIs complètes
- **Mocks** : Base de données et services externes
- **Couverture** : Objectif >80%

```bash
# Exemple test service
cd packages/product_service
npm test                    # Tests unitaires
npm run test:coverage       # Couverture
npm run test:watch          # Mode watch
```

## 📡 APIs

### Authentification
```bash
# Inscription
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}

# Connexion
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}

# Google OAuth
GET /api/auth/google
```

### Gestion d'entreprise
```bash
# Créer entreprise
POST /api/company
{
  "name": "Ma Société",
  "siret": "12345678901234",
  "siren": "123456789",
  "legal_form": "SARL",
  "address": "123 rue Example"
}
```

### Facturation
```bash
# Créer facture
POST /api/invoice
{
  "customer_id": "cust_123",
  "items": [
    {
      "name": "Consultation",
      "quantity": 1,
      "unit_price_excluding_tax": 100,
      "vat_rate": "STANDARD"
    }
  ]
}

# Générer PDF
GET /api/invoice/{id}/pdf
```

Voir la documentation complète des APIs : [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## 🚢 Déploiement

### Pipeline CI/CD automatisé
Le projet utilise GitHub Actions pour :
1. **Tests automatisés** sur tous les services
2. **Build Docker** multi-plateforme (AMD64/ARM64)  
3. **Scan sécurité** avec Trivy
4. **Push registry** DockerHub
5. **Déploiement** via Coolify

```yaml
# Déclenchement automatique sur push main
git push origin main
```

### Déploiement manuel
```bash
# Build toutes les images
docker-compose build

# Déploiement production
docker-compose -f docker-compose.prod.yml up -d

# Vérification santé
curl http://localhost:8080/health
```

### Environnements
- **Development** : `npm run dev`
- **Staging** : Déploiement automatique branche `develop`
- **Production** : Déploiement automatique branche `main`

## 📊 Monitoring

### Umami Analytics
- **Suivi usage** frontend
- **Métriques performance** (temps chargement, bounce rate)
- **Analyse trafic** (pages populaires, pays)

### Coolify Monitoring  
- **Santé services** : CPU, RAM, disk des conteneurs
- **Alertes automatiques** : Email sur incidents
- **Logs centralisés** : Historique et débogage
- **Déploiements** : Status et rollback

### Health Checks
Chaque service expose un endpoint `/health` :
```bash
# Status global
curl http://localhost:8080/health

# Service spécifique  
curl http://localhost:3001/health
```

## 🔒 Sécurité

### Mesures implémentées
- **Better Auth** : Authentification robuste avec sessions sécurisées
- **Helmet.js** : Headers de sécurité HTTP
- **Validation Joi** : Validation stricte des entrées
- **Prisma ORM** : Protection contre injections SQL
- **HTTPS** : Communication chiffrée obligatoire
- **Secrets** : Variables d'environnement, pas de hardcodage

### Audit de sécurité
```bash
# Audit npm
npm audit

# Scan containers (si Trivy installé)
trivy image zenbilling-auth-service:latest
```

## 🤝 Support

### Contact
- **Email** : support@zenbilling.com
- **Issues** : [GitHub Issues](https://github.com/ZenBillingApp/zenbilling-monorepo/issues)
- **Documentation** : Voir dossiers `docs/`

### Contribution
1. Fork du projet
2. Création branche feature (`git checkout -b feature/amazing-feature`)
3. Commit avec conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push branche (`git push origin feature/amazing-feature`)
5. Création Pull Request

## 📚 Documentation

### Structure documentation
```
docs/
├── API_DOCUMENTATION.md    # Documentation APIs complète
├── DEPLOYMENT.md          # Guide déploiement
├── CONTRIBUTING.md        # Guide contribution
├── ARCHITECTURE.md        # Architecture détaillée
└── CHANGELOG.md          # Historique des versions
```

### Dossiers RNCP
- `Dossier_Bloc2_RNCP.md` : Conception et développement
- `Dossier_Bloc4_RNCP.md` : Maintenance opérationnelle

## 📈 Versions

### Version actuelle : 1.0.0

**Fonctionnalités principales :**
- ✅ Architecture microservices complète (12 services)
- ✅ Authentification Better Auth + Google OAuth  
- ✅ CRUD complet : Entreprises, Clients, Produits
- ✅ Système facturation : Devis → Factures → PDF
- ✅ Paiements Stripe Connect
- ✅ IA OpenAI pour descriptions produits
- ✅ Dashboard analytics temps réel
- ✅ Pipeline CI/CD automatisé
- ✅ Monitoring Umami + Coolify

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet.

## 📄 Licence

Ce projet est sous licence ISC. Voir [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Hassan Jerrar**
- Formation : Mastère 2 Expert Développement Web
- GitHub : [@ZenBillingApp](https://github.com/ZenBillingApp)
- Email : hassan;jer78@gmail.com

---

<div align="center">

**⭐ N'hésitez pas à mettre une étoile si ce projet vous plaît ! ⭐**

</div>