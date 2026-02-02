import { Response } from "express";
import {
    DashboardService,
    InvoiceStatsData,
    QuoteStatsData,
    CustomerStatsData,
} from "../services/dashboard.service";
import {
    AuthRequest,
    ApiResponse,
    CustomError,
    logger,
    ServiceClients,
} from "@zenbilling/shared";

const dashboardService = new DashboardService();

export class DashboardController {
    public async getDashboardMetrics(req: AuthRequest, res: Response) {
        try {
            logger.info(
                { organizationId: req.gatewayUser?.organizationId },
                "Getting dashboard metrics",
            );

            const organizationId = req.gatewayUser?.organizationId!;

            // 1. Récupérer les clients pour les 3 services
            const invoiceClient = ServiceClients.getClient("invoice_service", req);
            const quoteClient = ServiceClients.getClient("quote_service", req);
            const customerClient = ServiceClients.getClient("customer_service", req);

            // 2. Appels en parallèle aux 3 services
            const [invoiceResponse, quoteResponse, customerResponse] =
                await Promise.all([
                    invoiceClient.get("/api/invoices/stats/all", {
                        headers: { "x-organization-id": organizationId },
                    }),
                    quoteClient.get("/api/quotes/stats/all", {
                        headers: { "x-organization-id": organizationId },
                    }),
                    customerClient.get("/api/customers/stats/top", {
                        headers: { "x-organization-id": organizationId },
                        params: { limit: 5 },
                    }),
                ]);

            // 3. Extraire les données des réponses
            const invoiceStats: InvoiceStatsData = invoiceResponse.data.data;
            const quoteStats: QuoteStatsData = quoteResponse.data.data;
            const customerStats: CustomerStatsData = {
                topCustomers: customerResponse.data.data.topCustomers,
            };

            // 4. Construire les métriques via le service
            const metrics = dashboardService.buildDashboardMetrics(
                invoiceStats,
                quoteStats,
                customerStats,
            );

            return ApiResponse.success(
                res,
                200,
                "Métriques du dashboard récupérées avec succès",
                metrics,
            );
        } catch (error) {
            logger.error({ error }, "Error fetching dashboard metrics");

            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }

            return ApiResponse.error(
                res,
                500,
                "Erreur lors de la récupération des métriques du dashboard",
            );
        }
    }
}
