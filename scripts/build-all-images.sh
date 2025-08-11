#!/bin/bash

# Script pour construire et pousser toutes les images Docker
# Usage: ./scripts/build-all-images.sh [OPTIONS]

set -e

# Configuration par défaut
REGISTRY="ghcr.io"
USERNAME=""
PUSH=false
BUILD_SHARED=true
PLATFORM="linux/amd64"
TAG="latest"

# Services à traiter
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

# Fonction d'aide
show_help() {
    cat << EOF
📦 Build All Docker Images - Zenbilling

Usage: $0 [OPTIONS]

OPTIONS:
    -u, --username USERNAME    Nom d'utilisateur GitHub (requis)
    -p, --push                 Pousser les images vers le registry
    -t, --tag TAG             Tag pour les images (défaut: latest)
    --platform PLATFORM       Plateforme cible (défaut: linux/amd64)
    --no-shared               Ne pas construire le package shared
    -h, --help                Afficher cette aide

EXEMPLES:
    $0 -u john-doe                           # Build local uniquement
    $0 -u john-doe --push                    # Build et push
    $0 -u john-doe --push --tag v1.2.3      # Build et push avec tag spécifique
    $0 -u john-doe --platform linux/arm64   # Build pour ARM64

EOF
}

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--username)
            USERNAME="$2"
            shift 2
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --no-shared)
            BUILD_SHARED=false
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Vérifier que le nom d'utilisateur est fourni
if [[ -z "$USERNAME" ]]; then
    echo "❌ Erreur: Nom d'utilisateur GitHub requis"
    show_help
    exit 1
fi

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$CURRENT_DIR")"
IMAGE_PREFIX="zenbilling"

echo "🚀 Construction des images Docker Zenbilling"
echo "👤 Nom d'utilisateur: $USERNAME"
echo "🏷️  Tag: $TAG"
echo "🌐 Plateforme: $PLATFORM"
echo "📤 Push: $([ "$PUSH" = true ] && echo "Oui" || echo "Non")"
echo "📦 Build shared: $([ "$BUILD_SHARED" = true ] && echo "Oui" || echo "Non")"
echo ""

# Se placer dans le répertoire racine
cd "$ROOT_DIR"

# Compteurs
BUILT=0
PUSHED=0
ERRORS=0

# Construire le package shared si nécessaire
if [[ "$BUILD_SHARED" = true ]]; then
    echo "🔧 Construction du package shared..."
    cd packages/shared
    
    if [[ -f package-lock.json ]]; then
        npm ci
    else
        npm install
    fi
    
    if npm run build; then
        echo "✅ Package shared construit"
    else
        echo "❌ Erreur lors de la construction du package shared"
        exit 1
    fi
    
    cd "$ROOT_DIR"
    echo ""
fi

# Fonction pour construire une image
build_image() {
    local service="$1"
    local full_image_name="$REGISTRY/$USERNAME/$IMAGE_PREFIX-$service:$TAG"
    local latest_image_name="$REGISTRY/$USERNAME/$IMAGE_PREFIX-$service:latest"
    
    echo "🏗️  Construction de $service..."
    
    # Vérifier que le Dockerfile existe
    if [[ ! -f "packages/$service/Dockerfile" ]]; then
        echo "❌ Dockerfile non trouvé pour $service"
        ((ERRORS++))
        return 1
    fi
    
    # Construire l'image
    local build_args=()
    if [[ "$TAG" != "latest" ]]; then
        build_args=(-t "$full_image_name" -t "$latest_image_name")
    else
        build_args=(-t "$full_image_name")
    fi
    
    if docker build \
        -f "packages/$service/Dockerfile" \
        --platform "$PLATFORM" \
        "${build_args[@]}" \
        .; then
        echo "✅ Image $service construite"
        ((BUILT++))
        
        # Pousser l'image si demandé
        if [[ "$PUSH" = true ]]; then
            echo "📤 Push de $service..."
            if docker push "$full_image_name"; then
                echo "✅ Image $service poussée"
                ((PUSHED++))
                
                # Pousser aussi le tag latest si différent
                if [[ "$TAG" != "latest" ]]; then
                    if docker push "$latest_image_name"; then
                        echo "✅ Tag latest pour $service poussé"
                    else
                        echo "⚠️  Échec du push du tag latest pour $service"
                    fi
                fi
            else
                echo "❌ Échec du push pour $service"
                ((ERRORS++))
                return 1
            fi
        fi
    else
        echo "❌ Échec de la construction pour $service"
        ((ERRORS++))
        return 1
    fi
    
    echo ""
}

# Login Docker si push demandé
if [[ "$PUSH" = true ]]; then
    echo "🔐 Connexion au registry GitHub..."
    if [[ -z "$GITHUB_TOKEN" ]]; then
        echo "⚠️  Variable GITHUB_TOKEN non définie, tentative de connexion interactive..."
        docker login ghcr.io -u "$USERNAME"
    else
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$USERNAME" --password-stdin
    fi
    echo ""
fi

# Construire toutes les images
echo "🏗️  Début de la construction des services..."
echo ""

for service in "${SERVICES[@]}"; do
    build_image "$service"
done

# Résumé final
echo "📊 Résumé de la construction:"
echo "   ✅ Images construites: $BUILT/${#SERVICES[@]}"
if [[ "$PUSH" = true ]]; then
    echo "   📤 Images poussées: $PUSHED"
fi
echo "   ❌ Erreurs: $ERRORS"

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo "🎉 Toutes les images ont été construites avec succès!"
    
    if [[ "$PUSH" = true ]]; then
        echo ""
        echo "🐳 Images disponibles sur GitHub Container Registry:"
        for service in "${SERVICES[@]}"; do
            echo "   - ghcr.io/$USERNAME/$IMAGE_PREFIX-$service:$TAG"
        done
    else
        echo ""
        echo "💡 Pour pousser les images, relancez avec l'option --push"
    fi
    
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Les images sont prêtes pour le déploiement sur Coolify"
    echo "   2. Mettez à jour vos variables d'environnement Coolify"
    echo "   3. Déployez les services dans l'ordre recommandé (voir DEPLOY.md)"
else
    echo ""
    echo "⚠️  Certaines constructions ont échoué. Vérifiez les erreurs ci-dessus."
    exit 1
fi