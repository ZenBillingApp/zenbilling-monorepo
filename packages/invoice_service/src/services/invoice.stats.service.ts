import { prisma, logger } from "@zenbilling/shared";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { InvoiceStatus } from "@prisma/client";

export interface InvoiceStatusCount {
    status: InvoiceStatus;
    _count: number;
}

/**
 * Service d'agrégation et statistiques pour les factures
 * Ces endpoints sont conçus pour être appelés par le Dashboard Service
 */
export class InvoiceStatsService {
    /**
     * Calcule le revenu mensuel (factures payées du mois en cours)
     */
    static async getMonthlyRevenue(organizationId: string): Promise<number> {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());

        logger.debug(
            { organizationId, startDate, endDate },
            "Calcul revenu mensuel"
        );

        const revenue = await prisma.invoice.aggregate({
            where: {
                organization_id: organizationId,
                invoice_date: {
                    gte: startDate,
                    lte: endDate,
                },
                status: InvoiceStatus.paid,
            },
            _sum: {
                amount_including_tax: true,
            },
        });

        return Number(revenue._sum?.amount_including_tax || 0);
    }

    /**
     * Calcule le revenu annuel (factures payées de l'année en cours)
     */
    static async getYearlyRevenue(organizationId: string): Promise<number> {
        const startDate = startOfYear(new Date());
        const endDate = endOfYear(new Date());

        logger.debug(
            { organizationId, startDate, endDate },
            "Calcul revenu annuel"
        );

        const revenue = await prisma.invoice.aggregate({
            where: {
                organization_id: organizationId,
                invoice_date: {
                    gte: startDate,
                    lte: endDate,
                },
                status: InvoiceStatus.paid,
            },
            _sum: {
                amount_including_tax: true,
            },
        });

        return Number(revenue._sum?.amount_including_tax || 0);
    }

    /**
     * Compte les factures en attente
     */
    static async getPendingInvoicesCount(
        organizationId: string
    ): Promise<number> {
        logger.debug({ organizationId }, "Comptage factures en attente");

        return prisma.invoice.count({
            where: {
                organization_id: organizationId,
                status: InvoiceStatus.pending,
            },
        });
    }

    /**
     * Compte les factures en retard
     */
    static async getOverdueInvoicesCount(
        organizationId: string
    ): Promise<number> {
        logger.debug({ organizationId }, "Comptage factures en retard");

        return prisma.invoice.count({
            where: {
                organization_id: organizationId,
                status: InvoiceStatus.late,
            },
        });
    }

    /**
     * Compte les factures payées (pour ratio devis/factures)
     */
    static async getPaidInvoicesCount(organizationId: string): Promise<number> {
        logger.debug({ organizationId }, "Comptage factures payées");

        return prisma.invoice.count({
            where: {
                organization_id: organizationId,
                status: InvoiceStatus.paid,
            },
        });
    }

    /**
     * Obtient la distribution des factures par statut
     */
    static async getStatusDistribution(
        organizationId: string
    ): Promise<InvoiceStatusCount[]> {
        logger.debug({ organizationId }, "Calcul distribution par statut");

        const distribution = await prisma.invoice.groupBy({
            by: ["status"],
            where: {
                organization_id: organizationId,
            },
            _count: true,
        });

        // Créer un objet pour faciliter la recherche des comptes
        const statusCounts: Record<InvoiceStatus, number> = {
            [InvoiceStatus.pending]: 0,
            [InvoiceStatus.sent]: 0,
            [InvoiceStatus.paid]: 0,
            [InvoiceStatus.cancelled]: 0,
            [InvoiceStatus.late]: 0,
        };

        // Remplir avec les valeurs réelles
        distribution.forEach((item) => {
            statusCounts[item.status] = item._count;
        });

        // Convertir en tableau avec tous les statuts
        return Object.entries(statusCounts).map(([status, count]) => ({
            status: status as InvoiceStatus,
            _count: count,
        }));
    }

    /**
     * Obtient toutes les statistiques en une seule requête
     */
    static async getAllStats(organizationId: string) {
        logger.info({ organizationId }, "Récupération de toutes les stats");

        const [
            monthlyRevenue,
            yearlyRevenue,
            pendingCount,
            overdueCount,
            paidCount,
            statusDistribution,
        ] = await Promise.all([
            this.getMonthlyRevenue(organizationId),
            this.getYearlyRevenue(organizationId),
            this.getPendingInvoicesCount(organizationId),
            this.getOverdueInvoicesCount(organizationId),
            this.getPaidInvoicesCount(organizationId),
            this.getStatusDistribution(organizationId),
        ]);

        return {
            monthlyRevenue,
            yearlyRevenue,
            pendingCount,
            overdueCount,
            paidCount,
            statusDistribution,
        };
    }
}
