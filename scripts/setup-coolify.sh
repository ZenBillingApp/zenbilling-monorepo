#!/bin/bash

# Script de configuration pour Coolify et GitHub Actions
# Ce script aide à configurer les webhooks et secrets nécessaires

set -e

echo "🚀 Configuration Coolify pour ZenBilling"
echo "========================================"

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages colorés
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Vérifier si nous sommes dans le bon répertoire
if [[ ! -f "package.json" ]] || [[ ! -d "packages" ]]; then
    print_error "Ce script doit être exécuté depuis la racine du projet zenbilling-monorepo"
    exit 1
fi

print_info "Configuration des services Coolify..."

# Services à configurer
services=(
    "api_gateway"
    "auth_service"
    "ai_service"
    "company_service"
    "customer_service"
    "dashboard_service"
    "email_service"
    "invoice_service"
    "pdf_service"
    "product_service"
    "quote_service"
    "stripe_service"
)

echo ""
print_info "Les services suivants seront configurés :"
for service in "${services[@]}"; do
    echo "  - $service"
done

echo ""
read -p "Voulez-vous continuer ? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Demander les informations de base
echo ""
print_info "Configuration des paramètres de base..."

read -p "URL de base de votre Coolify (ex: https://coolify.yourdomain.com): " COOLIFY_BASE_URL
read -p "Préfixe des webhooks Coolify (ex: https://coolify.yourdomain.com/api/v1/webhooks/): " WEBHOOK_PREFIX

# Vérifier que les URLs sont valides
if [[ ! $COOLIFY_BASE_URL =~ ^https?:// ]]; then
    print_error "L'URL de base Coolify doit commencer par http:// ou https://"
    exit 1
fi

if [[ ! $WEBHOOK_PREFIX =~ ^https?:// ]]; then
    print_error "Le préfixe des webhooks doit commencer par http:// ou https://"
    exit 1
fi

echo ""
print_info "Configuration GitHub Actions..."

echo ""
print_warning "Vous devez configurer les secrets suivants dans votre repository GitHub :"
echo "GitHub Repository -> Settings -> Secrets and variables -> Actions"
echo ""

# Afficher les secrets à configurer
echo "Secrets requis :"
echo "=================="
echo "COOLIFY_WEBHOOK_URL_PREFIX: ${WEBHOOK_PREFIX}"
echo "COOLIFY_BASE_URL: ${COOLIFY_BASE_URL}"
echo ""

# Générer les URLs de webhook pour chaque service
print_info "URLs de webhook pour chaque service :"
echo "========================================"
for service in "${services[@]}"; do
    webhook_url="${WEBHOOK_PREFIX}${service}"
    echo "Service: $service"
    echo "Webhook URL: $webhook_url"
    echo "Secret name: COOLIFY_WEBHOOK_URL_PREFIX"
    echo "---"
done

echo ""
print_info "Configuration des images Docker..."
echo "Les images suivantes seront utilisées :"
for service in "${services[@]}"; do
    image_name="ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com[/:]//' | sed 's/.git$//' | tr '[:upper:]' '[:lower:]')/zenbilling-${service}:latest"
    echo "  $service: $image_name"
done

echo ""
print_info "Étapes suivantes :"
echo "=================="
echo "1. Créez les applications dans Coolify pour chaque service"
echo "2. Configurez les variables d'environnement selon les fichiers coolify.json"
echo "3. Récupérez les URLs de webhook de chaque application"
echo "4. Configurez les secrets GitHub Actions mentionnés ci-dessus"
echo "5. Poussez votre code sur la branche main pour déclencher le premier déploiement"

echo ""
print_info "Variables d'environnement communes à configurer dans Coolify :"
echo "=============================================================="
echo "DATABASE_URL=postgresql://username:password@host:port/database"
echo "REDIS_URL=redis://host:port"
echo "NODE_ENV=production"

echo ""
print_success "Configuration terminée !"
print_info "Consultez le fichier README-DEPLOYMENT.md pour plus de détails"

# Créer un fichier de configuration de référence
cat > coolify-config-reference.md << EOF
# Configuration Coolify pour ZenBilling

## URLs de base
- Coolify Dashboard: ${COOLIFY_BASE_URL}
- Webhook Prefix: ${WEBHOOK_PREFIX}

## Services et leurs configurations

$(for service in "${services[@]}"; do
    echo "### $service"
    echo "- Port: $(grep -o '"port": [0-9]*' packages/$service/coolify.json | cut -d' ' -f2)"
    echo "- Image: ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com[/:]//' | sed 's/.git$//' | tr '[:upper:]' '[:lower:]')/zenbilling-${service}:latest"
    echo "- Webhook: ${WEBHOOK_PREFIX}${service}"
    echo ""
done)

## Variables d'environnement requises
Consultez les fichiers coolify.json de chaque service pour les variables spécifiques.
EOF

print_success "Fichier de référence créé : coolify-config-reference.md"