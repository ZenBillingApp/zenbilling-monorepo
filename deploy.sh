#!/bin/bash

# Script de déploiement manuel pour ZenBilling
# Usage: ./deploy.sh [service_name] [docker_username] [environment]
# Exemple: ./deploy.sh ai_service myusername dev
# Ou pour tous les services: ./deploy.sh all myusername prod

set -e

# Configuration
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

ENVIRONMENTS=("dev" "prod")

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé ou n'est pas dans le PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker n'est pas démarré ou vous n'avez pas les permissions"
        exit 1
    fi
    
    log_success "Prérequis OK"
}

# Build du package shared
build_shared_package() {
    log_info "Build du package shared..."
    
    cd packages/shared
    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances du package shared..."
        npm ci
    fi
    
    log_info "Compilation du package shared..."
    npm run build
    
    cd ../..
    log_success "Package shared compilé avec succès"
}

# Build et push d'un service
build_and_push_service() {
    local service_name=$1
    local docker_username=$2
    local environment=$3
    local service_path="packages/$service_name"
    
    if [ ! -d "$service_path" ]; then
        log_error "Service $service_name introuvable dans $service_path"
        return 1
    fi
    
    if [ ! -f "$service_path/Dockerfile" ]; then
        log_error "Dockerfile introuvable pour le service $service_name"
        return 1
    fi
    
    log_info "========================================="
    log_info "Build et push du service: $service_name ($environment)"
    log_info "========================================="
    
    # Définir les tags selon l'environnement
    local image_tag_env="$docker_username/zenbilling-$service_name:$environment"
    local image_tag_latest=""
    
    # Pour prod, on ajoute aussi le tag latest
    if [ "$environment" = "prod" ]; then
        image_tag_latest="$docker_username/zenbilling-$service_name:latest"
    fi
    
    log_info "Construction de l'image: $image_tag_env"
    
    # Build de l'image Docker
    if ! docker build -t "$image_tag_env" -f "$service_path/Dockerfile" .; then
        log_error "Échec du build pour le service $service_name"
        return 1
    fi
    
    # Tag latest pour prod
    if [ "$environment" = "prod" ] && [ -n "$image_tag_latest" ]; then
        log_info "Tag latest pour la production: $image_tag_latest"
        docker tag "$image_tag_env" "$image_tag_latest"
    fi
    
    log_success "Image construite: $image_tag_env"
    
    # Push de l'image avec tag environnement
    log_info "Push de l'image vers Docker Hub..."
    
    if ! docker push "$image_tag_env"; then
        log_error "Échec du push pour le service $service_name ($environment)"
        return 1
    fi
    
    # Push du tag latest pour prod
    if [ "$environment" = "prod" ] && [ -n "$image_tag_latest" ]; then
        log_info "Push du tag latest..."
        if ! docker push "$image_tag_latest"; then
            log_warning "Échec du push du tag latest pour $service_name"
        else
            log_success "Tag latest pushé: $image_tag_latest"
        fi
    fi
    
    log_success "Service $service_name ($environment) pushé avec succès vers Docker Hub"
    return 0
}

# Affichage de l'aide
show_help() {
    echo "Usage: $0 [service_name|all] [docker_username] [environment]"
    echo ""
    echo "Arguments:"
    echo "  service_name    Nom du service à déployer ou 'all' pour tous les services"
    echo "  docker_username Nom d'utilisateur Docker Hub"
    echo "  environment     Environnement cible (dev|prod)"
    echo ""
    echo "Services disponibles:"
    for service in "${SERVICES[@]}"; do
        echo "  - $service"
    done
    echo ""
    echo "Environnements disponibles:"
    for env in "${ENVIRONMENTS[@]}"; do
        echo "  - $env"
    done
    echo ""
    echo "Exemples:"
    echo "  $0 ai_service myusername dev"
    echo "  $0 all myusername prod"
    echo ""
    echo "Notes:"
    echo "  - L'environnement 'dev' créé des tags avec le suffixe :dev"
    echo "  - L'environnement 'prod' créé des tags :prod et :latest"
}

# Fonction principale
main() {
    if [ $# -ne 3 ]; then
        log_error "Arguments manquants"
        show_help
        exit 1
    fi
    
    local target=$1
    local docker_username=$2
    local environment=$3
    
    if [ -z "$docker_username" ]; then
        log_error "Nom d'utilisateur Docker requis"
        show_help
        exit 1
    fi
    
    # Vérifier que l'environnement est valide
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " $environment " ]]; then
        log_error "Environnement '$environment' non reconnu"
        log_info "Environnements disponibles: ${ENVIRONMENTS[*]}"
        exit 1
    fi
    
    log_info "Début du déploiement pour: $target"
    log_info "Utilisateur Docker Hub: $docker_username"
    log_info "Environnement: $environment"
    
    # Vérification des prérequis
    check_prerequisites
    
    # Vérification de la connexion Docker Hub
    log_info "Vérification de la connexion à Docker Hub..."
    if ! docker info | grep -q "Username: $docker_username" 2>/dev/null; then
        log_warning "Vous n'êtes peut-être pas connecté à Docker Hub"
        log_info "Tentative de connexion..."
        if ! docker login; then
            log_error "Échec de la connexion à Docker Hub"
            exit 1
        fi
    fi
    log_success "Connexion Docker Hub OK"
    
    # Build du package shared
    build_shared_package
    
    # Variables pour le suivi
    local success_count=0
    local failure_count=0
    local failed_services=()
    
    if [ "$target" = "all" ]; then
        log_info "Déploiement de tous les services en environnement $environment..."
        
        for service in "${SERVICES[@]}"; do
            if build_and_push_service "$service" "$docker_username" "$environment"; then
                ((success_count++))
            else
                ((failure_count++))
                failed_services+=("$service")
            fi
        done
        
    else
        # Vérifier que le service existe
        if [[ ! " ${SERVICES[@]} " =~ " $target " ]]; then
            log_error "Service '$target' non reconnu"
            log_info "Services disponibles: ${SERVICES[*]}"
            exit 1
        fi
        
        if build_and_push_service "$target" "$docker_username" "$environment"; then
            ((success_count++))
        else
            ((failure_count++))
            failed_services+=("$target")
        fi
    fi
    
    # Résumé final
    echo ""
    log_info "========================================="
    log_info "RÉSUMÉ DU DÉPLOIEMENT ($environment)"
    log_info "========================================="
    log_success "Services réussis: $success_count"
    
    if [ $failure_count -gt 0 ]; then
        log_error "Services échoués: $failure_count"
        log_error "Services en échec: ${failed_services[*]}"
    fi
    
    if [ $failure_count -eq 0 ]; then
        log_success "Tous les services ont été déployés avec succès en $environment! 🎉"
    else
        log_warning "Certains services ont échoué. Vérifiez les logs ci-dessus."
        exit 1
    fi
}

# Point d'entrée
main "$@"