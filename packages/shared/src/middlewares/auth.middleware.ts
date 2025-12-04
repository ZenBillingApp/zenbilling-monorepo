import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse";
import logger from "../utils/logger";

/**
 * Interface étendue pour inclure les informations utilisateur transmises par le Gateway
 */
export interface GatewayAuthRequest extends Request {
    gatewayUser?: {
        id: string;
        sessionId: string;
        organizationId?: string;
    };
}

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Lire les headers ajoutés par le Gateway
        const userId = req.headers["x-user-id"] as string;
        const sessionId = req.headers["x-session-id"] as string;
        const organizationId = req.headers["x-organization-id"] as
            | string
            | undefined;

        // Vérifier que les headers requis sont présents
        if (!userId || !sessionId) {
            logger.warn(
                {
                    headers: req.headers,
                    path: req.path,
                },
                "Gateway auth headers manquants - La requête n'a pas été authentifiée par le Gateway"
            );

            ApiResponse.error(
                res,
                401,
                "Non autorisé - Headers d'authentification manquants"
            );
            return;
        }

        // Attacher les informations utilisateur à la requête
        (req as GatewayAuthRequest).gatewayUser = {
            id: userId,
            sessionId: sessionId,
            organizationId: organizationId,
        };

        logger.info(
            {
                userId,
                organizationId,
                path: req.path,
                method: req.method,
            },
            "Utilisateur authentifié via Gateway"
        );

        next();
    } catch (error) {
        logger.error({ error }, "Erreur dans gatewayAuthMiddleware");
        ApiResponse.error(
            res,
            500,
            "Erreur interne lors de la vérification de l'authentification"
        );
    }
}
