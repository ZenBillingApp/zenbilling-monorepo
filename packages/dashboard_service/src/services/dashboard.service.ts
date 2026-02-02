import { logger } from "@zenbilling/shared";
import {
    DashboardMetrics,
    TopCustomer,
    InvoiceStatusCount,
    QuoteStatusCount,
} from "@zenbilling/shared";

/**
 * Interface pour les données brutes des factures
 */
export interface InvoiceStatsData {
    monthlyRevenue: number;
    yearlyRevenue: number;
    pendingCount: number;
    overdueCount: number;
    paidCount: number;
    statusDistribution: InvoiceStatusCount[];
}

/**
 * Interface pour les données brutes des devis
 */
export interface QuoteStatsData {
    monthlyCount: number;
    yearlyCount: number;
    pendingCount: number;
    acceptedCount: number;
    statusDistribution: QuoteStatusCount[];
}

/**
 * Interface pour les données brutes des clients
 */
export interface CustomerStatsData {
    topCustomers: TopCustomer[];
}

/**
 * Service Dashboard - traite les données collectées par le controller
 * Ne fait aucun appel inter-service directement
 */
export class DashboardService {
    /**
     * Agrège les métriques du dashboard à partir des données des différents services
     * @param invoiceStats - Données des factures (provenant de invoice_service)
     * @param quoteStats - Données des devis (provenant de quote_service)
     * @param customerStats - Données des clients (provenant de customer_service)
     * @returns Métriques agrégées du dashboard
     */
    buildDashboardMetrics(
        invoiceStats: InvoiceStatsData,
        quoteStats: QuoteStatsData,
        customerStats: CustomerStatsData
    ): DashboardMetrics {
        logger.info("Construction des métriques dashboard");

        // Calculer le ratio devis acceptés / factures payées
        const quoteToInvoiceRatio =
            invoiceStats.paidCount > 0
                ? Number(
                      (quoteStats.acceptedCount / invoiceStats.paidCount).toFixed(2)
                  )
                : 0;

        return {
            monthlyRevenue: invoiceStats.monthlyRevenue,
            yearlyRevenue: invoiceStats.yearlyRevenue,
            pendingInvoices: invoiceStats.pendingCount,
            overdueInvoices: invoiceStats.overdueCount,
            topCustomers: customerStats.topCustomers,
            invoiceStatusDistribution: invoiceStats.statusDistribution,
            monthlyQuotes: quoteStats.monthlyCount,
            yearlyQuotes: quoteStats.yearlyCount,
            pendingQuotes: quoteStats.pendingCount,
            acceptedQuotes: quoteStats.acceptedCount,
            quoteStatusDistribution: quoteStats.statusDistribution,
            quoteToInvoiceRatio,
        };
    }
}
