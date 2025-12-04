const { jwtVerify, createRemoteJWKSet } = require("jose");

module.exports = {
    name: "better-auth-jwt",

    schema: {
        $id: "http://express-gateway.io/schemas/policies/better-auth-jwt.json",
        type: "object",
        properties: {
            jwksUrl: {
                type: "string",
                description:
                    "URL du endpoint JWKS (défaut: AUTH_SERVICE_URL/api/auth/jwks)",
            },
        },
    },

    policy: (params) => {
        // JWKS URL (clés publiques pour vérifier signatures)
        const jwksUrl =
            params.jwksUrl ||
            (process.env.AUTH_SERVICE_URL || "http://localhost:3001") +
                "/api/auth/jwks";

        // Créer le JWKS Set (cache automatique par jose)
        const JWKS = createRemoteJWKSet(new URL(jwksUrl));

        return async (req, res, next) => {
            try {
                // 1. Extraire le JWT du header Authorization
                const authHeader = req.headers.authorization;

                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return res.status(401).json({
                        success: false,
                        message:
                            "Token manquant - Authorization: Bearer <token> requis",
                    });
                }

                const token = authHeader.substring(7); // Enlever "Bearer "

                // 2. Valider le JWT avec jose
                // Vérifie: signature, expiration, issuer, audience
                const { payload } = await jwtVerify(token, JWKS, {
                    issuer:
                        process.env.BETTER_AUTH_URL || "http://localhost:3001",
                    audience:
                        process.env.API_GATEWAY_URL || "http://localhost:8080",
                });

                // 3. Ajouter les headers pour les microservices
                req.headers["x-user-id"] = payload.sub; // User ID
                req.headers["x-user-email"] = payload.email;
                req.headers["x-user-name"] = payload.name;
                req.headers["x-session-id"] = payload.sessionId;

                if (payload.activeOrganizationId) {
                    req.headers["x-organization-id"] =
                        payload.activeOrganizationId;
                }

                next();
            } catch (error) {
                console.error(
                    "[JWT Policy] Token validation failed:",
                    error.message
                );

                // Erreurs spécifiques
                let message = "Token invalide";

                if (error.code === "ERR_JWT_EXPIRED") {
                    message = "Token expiré";
                } else if (
                    error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED"
                ) {
                    message = "Signature token invalide";
                } else if (error.code === "ERR_JWT_CLAIM_VALIDATION_FAILED") {
                    message = "Claims JWT invalides (issuer/audience)";
                }

                return res.status(401).json({
                    success: false,
                    message: message,
                });
            }
        };
    },
};
