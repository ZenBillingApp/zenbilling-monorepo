import { Request, Response } from "express";
import { CustomerStatsService } from "../services/customer.stats.service";
import { ApiResponse, logger, GatewayAuthRequest } from "@zenbilling/shared";

/**
 * Contrôleur pour les endpoints de statistiques des clients
 * Ces endpoints sont destinés aux appels inter-services (ex: Dashboard Service)
 */
export class CustomerStatsController {
    /**
     * GET /api/customers/stats/top
     * Récupère les meilleurs clients par nombre de factures
     */
    static async getTopCustomers(req: Request, res: Response) {
        try {
            const organizationId = (req as GatewayAuthRequest).gatewayUser
                ?.organizationId;

            if (!organizationId) {
                return ApiResponse.error(
                    res,
                    400,
                    "Organization ID manquant"
                );
            }

            // Récupérer le paramètre limit depuis query params (défaut: 5)
            const limit = req.query.limit
                ? parseInt(req.query.limit as string, 10)
                : 5;

            if (isNaN(limit) || limit < 1 || limit > 50) {
                return ApiResponse.error(
                    res,
                    400,
                    "Le paramètre limit doit être un nombre entre 1 et 50"
                );
            }

            logger.info(
                { organizationId, limit },
                "Récupération des top customers (inter-service)"
            );

            const topCustomers = await CustomerStatsService.getTopCustomers(
                organizationId,
                limit
            );

            return ApiResponse.success(
                res,
                200,
                "Top customers récupérés avec succès",
                { topCustomers }
            );
        } catch (error) {
            logger.error({ error }, "Erreur récupération top customers");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
