#!/bin/bash

# Script utilitaire pour gérer les déploiements ZenBilling
# Usage: ./scripts/deploy.sh [command] [options]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if gh CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) is required. Install it from: https://cli.github.com/"
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        error "Please authenticate with GitHub CLI: gh auth login"
    fi
}

# Show help
show_help() {
    cat << EOF
ZenBilling Deployment Manager

USAGE:
    ./scripts/deploy.sh [COMMAND] [OPTIONS]

COMMANDS:
    production [services]     Deploy to production (main branch only)
    rollback [services]       Rollback services to previous version
    rollback-to [sha]         Rollback to specific commit
    status                    Check deployment status
    logs [workflow_id]        Show workflow logs
    health                    Check services health
    help                      Show this help

EXAMPLES:
    # Deploy all changed services to production
    ./scripts/deploy.sh production

    # Force deploy specific services
    ./scripts/deploy.sh production "auth_service,company_service"

    # Rollback all services
    ./scripts/deploy.sh rollback all

    # Rollback specific services
    ./scripts/deploy.sh rollback "auth_service,stripe_service"

    # Rollback to specific commit
    ./scripts/deploy.sh rollback-to abc123def

    # Check health of production services
    ./scripts/deploy.sh health

    # Check recent deployment status
    ./scripts/deploy.sh status
EOF
}

# Deploy to production
deploy_production() {
    local services="${1:-auto}"
    
    log "Deploying to production..."
    
    # Check current branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$current_branch" != "main" ]]; then
        warning "Current branch is '$current_branch', not 'main'"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        warning "You have uncommitted changes"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Trigger workflow
    if [[ "$services" == "auto" ]]; then
        log "Triggering production deployment (auto-detect changes)..."
        gh workflow run production.yml
    else
        log "Force deploying services: $services"
        gh workflow run production.yml -f force_deploy=true
    fi
    
    success "Production deployment triggered"
    log "Monitor progress with: gh run list --workflow=production.yml"
}

# Rollback services
rollback_services() {
    local services="${1:-all}"
    local target_sha="${2:-}"
    
    log "Rolling back services: $services"
    
    if [[ -n "$target_sha" ]]; then
        log "Target SHA: $target_sha"
        gh workflow run rollback.yml -f services="$services" -f target_sha="$target_sha"
    else
        log "Rolling back to previous commit"
        gh workflow run rollback.yml -f services="$services"
    fi
    
    success "Rollback initiated"
    log "Monitor progress with: gh run list --workflow=rollback.yml"
}

# Check deployment status
check_status() {
    log "Recent workflow runs:"
    gh run list --limit 10
    
    echo
    log "Current production workflow status:"
    gh run list --workflow=production.yml --limit 5
}

# Show workflow logs
show_logs() {
    local workflow_id="$1"
    
    if [[ -z "$workflow_id" ]]; then
        log "Getting latest workflow run..."
        workflow_id=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
    fi
    
    log "Showing logs for workflow run: $workflow_id"
    gh run view "$workflow_id" --log
}

# Health check
health_check() {
    log "Checking services health..."
    
    # You'll need to configure your production URL
    BASE_URL="${COOLIFY_BASE_URL:-https://your-production-domain.com}"
    
    if [[ "$BASE_URL" == "https://your-production-domain.com" ]]; then
        warning "Please configure COOLIFY_BASE_URL environment variable"
        warning "Example: export COOLIFY_BASE_URL=https://your-domain.com"
        exit 1
    fi
    
    services=(
        "api_gateway:/"
        "auth_service:/api/auth_service/health"
        "ai_service:/api/ai_service/health"
        "company_service:/api/company_service/health"
        "customer_service:/api/customer_service/health"
        "dashboard_service:/api/dashboard_service/health"
        "email_service:/api/email_service/health"
        "invoice_service:/api/invoice_service/health"
        "pdf_service:/api/pdf_service/health"
        "product_service:/api/product_service/health"
        "quote_service:/api/quote_service/health"
        "stripe_service:/api/stripe_service/health"
    )
    
    failed_services=()
    
    for service_path in "${services[@]}"; do
        IFS=':' read -r service path <<< "$service_path"
        url="${BASE_URL}${path}"
        
        log "Checking $service at $url"
        
        if curl -f -s --max-time 10 "$url" > /dev/null; then
            success "$service is healthy"
        else
            error_msg="$service health check failed"
            echo -e "${RED}❌ $error_msg${NC}"
            failed_services+=("$service")
        fi
    done
    
    echo
    if [ ${#failed_services[@]} -gt 0 ]; then
        error "Health checks failed for: ${failed_services[*]}"
    else
        success "All services are healthy! 🎉"
    fi
}

# Main script logic
main() {
    cd "$ROOT_DIR"
    
    case "${1:-help}" in
        "production")
            check_gh_cli
            deploy_production "$2"
            ;;
        "rollback")
            check_gh_cli
            rollback_services "$2"
            ;;
        "rollback-to")
            check_gh_cli
            rollback_services "all" "$2"
            ;;
        "status")
            check_gh_cli
            check_status
            ;;
        "logs")
            check_gh_cli
            show_logs "$2"
            ;;
        "health")
            health_check
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use './scripts/deploy.sh help' for usage information"
            exit 1
            ;;
    esac
}

main "$@"