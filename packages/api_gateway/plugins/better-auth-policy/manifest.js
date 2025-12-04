/**
 * Better Auth JWT Policy Plugin Manifest
 *
 * Ce plugin fournit une policy d'authentification JWT qui valide les tokens Better Auth
 * via validation cryptographique (JWKS) sans dépendance au package shared.
 *
 * Policies disponibles:
 * - better-auth-jwt: Validation JWT avec jose (RECOMMANDÉ)
 * - better-auth: Validation session avec appel auth_service (LEGACY)
 */

module.exports = {
    version: "1.0.0",
    init: function (pluginContext) {
        // Policy JWT (recommandée)
        const jwtPolicy = require("./policies/better-auth-jwt-policy");
        pluginContext.registerPolicy(jwtPolicy);
    },
    policies: ["better-auth-jwt"],
    schema: {
        $id: "http://express-gateway.io/schemas/plugins/better-auth-policy.json",
        type: "object",
        properties: {
            jwksUrl: {
                type: "string",
                description:
                    "URL du endpoint JWKS pour récupérer les clés publiques",
            },
        },
    },
};
