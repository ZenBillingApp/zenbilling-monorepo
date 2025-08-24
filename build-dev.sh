#!/bin/bash

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"hvssvn78"}
REGISTRY=${DOCKER_USERNAME}
VERSION="dev-$(date +%Y%m%d-%H%M%S)"

# Services à build
SERVICES=(
    "ai_service"
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
)

echo "🚀 Build et push de tous les services ZenBilling pour DEV..."

# Vérifier la connexion Docker Hub
if ! docker login -u "$DOCKER_USERNAME" &> /dev/null; then
    echo "❌ Erreur de connexion à Docker Hub"
    exit 1
fi

# Build et push chaque service pour DEV
for service in "${SERVICES[@]}"; do
    echo "📦 Building $service pour DEV..."
    
    if docker build -t "$REGISTRY/$service:dev" -t "$REGISTRY/$service:dev-$VERSION" "./packages/$service" && \
       docker push "$REGISTRY/$service:dev" && \
       docker push "$REGISTRY/$service:dev-$VERSION"; then
        echo "✅ $service build et push avec succès pour DEV"
    else
        echo "❌ Échec pour $service"
        exit 1
    fi
done

echo "🎉 Tous les services ont été build et push avec succès pour DEV !"
echo "📋 Version: $VERSION"
