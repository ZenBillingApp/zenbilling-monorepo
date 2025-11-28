import { Response } from "express";
import { DashboardService } from "../services/dashboard.service";
import { AuthRequest } from "@zenbilling/shared";
import { ApiResponse } from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";

const dashboardService = new DashboardService();

export class DashboardController {
    public async getDashboardMetrics(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return ApiResponse.error(res, 401, "Non autorisé");
            }

            const organizationId = req.organization!.id;
            const metrics = await dashboardService.getAllMetrics(
                organizationId
            );

            return ApiResponse.success(
                res,
                200,
                "Métriques du dashboard récupérées avec succès",
                metrics
            );
        } catch (error) {
            logger.error({ error }, "Error fetching dashboard metrics");

            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }

            return ApiResponse.error(
                res,
                500,
                "Erreur lors de la récupération des métriques du dashboard"
            );
        }
    }
}
