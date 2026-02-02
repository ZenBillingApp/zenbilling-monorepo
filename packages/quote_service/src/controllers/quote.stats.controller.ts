import { Request, Response } from "express";
import { QuoteStatsService } from "../services/quote.stats.service";
import { ApiResponse, logger, GatewayAuthRequest } from "@zenbilling/shared";

/**
 * Contrôleur pour les endpoints de statistiques des devis
 * Ces endpoints sont destinés aux appels inter-services (ex: Dashboard Service)
 */
export class QuoteStatsController {
    /**
     * GET /api/quotes/stats/all
     * Récupère toutes les statistiques en une seule requête
     */
    static async getAllStats(req: Request, res: Response) {
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

            logger.info(
                { organizationId },
                "Récupération de toutes les stats devis (inter-service)"
            );

            const stats = await QuoteStatsService.getAllStats(organizationId);

            return ApiResponse.success(
                res,
                200,
                "Statistiques devis récupérées avec succès",
                stats
            );
        } catch (error) {
            logger.error({ error }, "Erreur récupération stats devis");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/quotes/stats/monthly-count
     */
    static async getMonthlyCount(req: Request, res: Response) {
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

            const count =
                await QuoteStatsService.getMonthlyQuotesCount(organizationId);

            return ApiResponse.success(res, 200, "Comptage devis mensuels", {
                count,
            });
        } catch (error) {
            logger.error({ error }, "Erreur comptage devis mensuels");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/quotes/stats/yearly-count
     */
    static async getYearlyCount(req: Request, res: Response) {
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

            const count =
                await QuoteStatsService.getYearlyQuotesCount(organizationId);

            return ApiResponse.success(res, 200, "Comptage devis annuels", {
                count,
            });
        } catch (error) {
            logger.error({ error }, "Erreur comptage devis annuels");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/quotes/stats/pending-count
     */
    static async getPendingCount(req: Request, res: Response) {
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

            const count =
                await QuoteStatsService.getPendingQuotesCount(organizationId);

            return ApiResponse.success(
                res,
                200,
                "Comptage devis en attente",
                { count }
            );
        } catch (error) {
            logger.error({ error }, "Erreur comptage devis pending");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/quotes/stats/accepted-count
     */
    static async getAcceptedCount(req: Request, res: Response) {
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

            const count =
                await QuoteStatsService.getAcceptedQuotesCount(organizationId);

            return ApiResponse.success(res, 200, "Comptage devis acceptés", {
                count,
            });
        } catch (error) {
            logger.error({ error }, "Erreur comptage devis acceptés");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/quotes/stats/status-distribution
     */
    static async getStatusDistribution(req: Request, res: Response) {
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

            const distribution =
                await QuoteStatsService.getStatusDistribution(organizationId);

            return ApiResponse.success(
                res,
                200,
                "Distribution devis par statut récupérée",
                { distribution }
            );
        } catch (error) {
            logger.error({ error }, "Erreur récupération distribution devis");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
