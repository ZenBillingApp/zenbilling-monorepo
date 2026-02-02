import { Request, Response } from "express";
import { InvoiceStatsService } from "../services/invoice.stats.service";
import { ApiResponse, logger, GatewayAuthRequest } from "@zenbilling/shared";

/**
 * Contrôleur pour les endpoints de statistiques des factures
 * Ces endpoints sont destinés aux appels inter-services (ex: Dashboard Service)
 */
export class InvoiceStatsController {
    /**
     * GET /api/invoices/stats/all
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
                "Récupération de toutes les stats (inter-service)"
            );

            const stats = await InvoiceStatsService.getAllStats(organizationId);

            return ApiResponse.success(
                res,
                200,
                "Statistiques récupérées avec succès",
                stats
            );
        } catch (error) {
            logger.error({ error }, "Erreur récupération stats");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/invoices/stats/monthly-revenue
     */
    static async getMonthlyRevenue(req: Request, res: Response) {
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

            const revenue =
                await InvoiceStatsService.getMonthlyRevenue(organizationId);

            return ApiResponse.success(
                res,
                200,
                "Revenu mensuel récupéré",
                { revenue }
            );
        } catch (error) {
            logger.error({ error }, "Erreur récupération revenu mensuel");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/invoices/stats/yearly-revenue
     */
    static async getYearlyRevenue(req: Request, res: Response) {
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

            const revenue =
                await InvoiceStatsService.getYearlyRevenue(organizationId);

            return ApiResponse.success(res, 200, "Revenu annuel récupéré", {
                revenue,
            });
        } catch (error) {
            logger.error({ error }, "Erreur récupération revenu annuel");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/invoices/stats/pending-count
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
                await InvoiceStatsService.getPendingInvoicesCount(
                    organizationId
                );

            return ApiResponse.success(
                res,
                200,
                "Comptage factures en attente",
                { count }
            );
        } catch (error) {
            logger.error({ error }, "Erreur comptage factures pending");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/invoices/stats/overdue-count
     */
    static async getOverdueCount(req: Request, res: Response) {
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
                await InvoiceStatsService.getOverdueInvoicesCount(
                    organizationId
                );

            return ApiResponse.success(
                res,
                200,
                "Comptage factures en retard",
                { count }
            );
        } catch (error) {
            logger.error({ error }, "Erreur comptage factures overdue");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/invoices/stats/paid-count
     */
    static async getPaidCount(req: Request, res: Response) {
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
                await InvoiceStatsService.getPaidInvoicesCount(organizationId);

            return ApiResponse.success(
                res,
                200,
                "Comptage factures payées",
                { count }
            );
        } catch (error) {
            logger.error({ error }, "Erreur comptage factures paid");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * GET /api/invoices/stats/status-distribution
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
                await InvoiceStatsService.getStatusDistribution(organizationId);

            return ApiResponse.success(
                res,
                200,
                "Distribution par statut récupérée",
                { distribution }
            );
        } catch (error) {
            logger.error({ error }, "Erreur récupération distribution");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
