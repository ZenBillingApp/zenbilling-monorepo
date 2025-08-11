#!/bin/bash

# Script pour mettre à jour les configurations Coolify avec le bon nom d'utilisateur
# Usage: ./scripts/update-coolify-configs.sh VOTRE_USERNAME_GITHUB

set -e

# Vérifier que l'argument username est fourni
if [ $# -eq 0 ]; then
    echo "❌ Erreur: Nom d'utilisateur GitHub requis"
    echo "Usage: $0 VOTRE_USERNAME_GITHUB"
    echo "Exemple: $0 john-doe"
    exit 1
fi

USERNAME="$1"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$CURRENT_DIR")"

echo "🔧 Mise à jour des configurations Coolify..."
echo "👤 Nom d'utilisateur: $USERNAME"
echo "📁 Répertoire racine: $ROOT_DIR"

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

# Compteurs
UPDATED=0
ERRORS=0

# Fonction pour mettre à jour un fichier coolify.json
update_coolify_config() {
    local service="$1"
    local config_file="$ROOT_DIR/packages/$service/coolify.json"
    
    if [[ ! -f "$config_file" ]]; then
        echo "⚠️  Fichier non trouvé: $config_file"
        ((ERRORS++))
        return 1
    fi
    
    # Sauvegarder l'original
    cp "$config_file" "$config_file.backup"
    
    # Remplacer your-username par le vrai nom d'utilisateur
    if sed -i.tmp "s/your-username/$USERNAME/g" "$config_file" && rm "$config_file.tmp"; then
        echo "✅ Mis à jour: packages/$service/coolify.json"
        ((UPDATED++))
    else
        echo "❌ Erreur lors de la mise à jour: packages/$service/coolify.json"
        # Restaurer la sauvegarde en cas d'erreur
        mv "$config_file.backup" "$config_file"
        ((ERRORS++))
        return 1
    fi
    
    # Supprimer la sauvegarde si tout s'est bien passé
    rm "$config_file.backup"
}

# Traiter chaque service
echo ""
for service in "${SERVICES[@]}"; do
    update_coolify_config "$service"
done

# Mettre à jour aussi les fichiers GitHub
echo ""
echo "🔧 Mise à jour des fichiers GitHub..."

# CODEOWNERS
CODEOWNERS_FILE="$ROOT_DIR/.github/CODEOWNERS"
if [[ -f "$CODEOWNERS_FILE" ]]; then
    cp "$CODEOWNERS_FILE" "$CODEOWNERS_FILE.backup"
    if sed -i.tmp "s/VOTRE_USERNAME/$USERNAME/g" "$CODEOWNERS_FILE" && rm "$CODEOWNERS_FILE.tmp"; then
        echo "✅ Mis à jour: .github/CODEOWNERS"
        rm "$CODEOWNERS_FILE.backup"
        ((UPDATED++))
    else
        echo "❌ Erreur lors de la mise à jour: .github/CODEOWNERS"
        mv "$CODEOWNERS_FILE.backup" "$CODEOWNERS_FILE"
        ((ERRORS++))
    fi
fi

# Dependabot
DEPENDABOT_FILE="$ROOT_DIR/.github/dependabot.yml"
if [[ -f "$DEPENDABOT_FILE" ]]; then
    cp "$DEPENDABOT_FILE" "$DEPENDABOT_FILE.backup"
    if sed -i.tmp "s/VOTRE_USERNAME/$USERNAME/g" "$DEPENDABOT_FILE" && rm "$DEPENDABOT_FILE.tmp"; then
        echo "✅ Mis à jour: .github/dependabot.yml"
        rm "$DEPENDABOT_FILE.backup"
        ((UPDATED++))
    else
        echo "❌ Erreur lors de la mise à jour: .github/dependabot.yml"
        mv "$DEPENDABOT_FILE.backup" "$DEPENDABOT_FILE"
        ((ERRORS++))
    fi
fi

# Résumé
echo ""
echo "📊 Résumé de la mise à jour:"
echo "   ✅ Fichiers mis à jour: $UPDATED"
echo "   ❌ Erreurs: $ERRORS"

if [[ $ERRORS -eq 0 ]]; then
    echo ""
    echo "🎉 Toutes les configurations ont été mises à jour avec succès!"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "   1. Vérifiez les changements: git diff"
    echo "   2. Committez les changements: git add . && git commit -m 'chore: update GitHub username in configs'"
    echo "   3. Poussez vers GitHub: git push"
    echo "   4. Les workflows GitHub Actions sont maintenant prêts à être utilisés"
    echo ""
    echo "🐳 Images Docker qui seront créées:"
    for service in "${SERVICES[@]}"; do
        echo "   - ghcr.io/$USERNAME/zenbilling-$service:latest"
    done
else
    echo ""
    echo "⚠️  Certaines mises à jour ont échoué. Vérifiez les erreurs ci-dessus."
    echo "💡 Les fichiers de sauvegarde (.backup) peuvent être restaurés si nécessaire."
fi