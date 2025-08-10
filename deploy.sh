#!/bin/bash

# Script de déploiement automatique pour Zenbilling
# Usage: ./deploy.sh [registry-username]

set -e

# Configuration
REGISTRY="ghcr.io"
USERNAME=${1:-"your-username"}
TAG=${2:-"latest"}

# Services à déployer
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

echo "🚀 Démarrage du déploiement Zenbilling"
echo "Registry: $REGISTRY"
echo "Username: $USERNAME"
echo "Tag: $TAG"
echo ""

# Vérification des prérequis
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon n'est pas accessible"
    exit 1
fi

echo "✅ Docker vérifié"

# Login au registry (optionnel, si nécessaire)
echo "🔐 Login au registry..."
echo $GITHUB_TOKEN | docker login $REGISTRY -u $USERNAME --password-stdin 2>/dev/null || echo "⚠️  Login ignoré (peut être déjà connecté)"

# Build et push de chaque service
for service in "${SERVICES[@]}"; do
    echo ""
    echo "📦 Traitement du service: $service"
    
    IMAGE_NAME="$REGISTRY/$USERNAME/zenbilling-$service:$TAG"
    
    # Vérifier que le Dockerfile existe
    DOCKERFILE_PATH="packages/$service/Dockerfile"
    if [ ! -f "$DOCKERFILE_PATH" ]; then
        echo "❌ Dockerfile manquant: $DOCKERFILE_PATH"
        continue
    fi
    
    echo "   🏗️  Build en cours..."
    if docker build -f "$DOCKERFILE_PATH" -t "$IMAGE_NAME" . --quiet; then
        echo "   ✅ Build réussi"
    else
        echo "   ❌ Échec du build pour $service"
        continue
    fi
    
    echo "   📤 Push en cours..."
    if docker push "$IMAGE_NAME" --quiet; then
        echo "   ✅ Push réussi: $IMAGE_NAME"
    else
        echo "   ❌ Échec du push pour $service"
    fi
done

echo ""
echo "🎉 Déploiement terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurer vos variables d'environnement dans Coolify"
echo "2. Créer les applications dans Coolify avec les images pushées"
echo "3. Configurer le réseau 'zenbilling-network'"
echo "4. Déployer dans l'ordre: auth_service → services métier → api_gateway"
echo ""
echo "📖 Voir DEPLOY.md pour plus de détails"