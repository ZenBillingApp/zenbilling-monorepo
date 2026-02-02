import { prisma, logger } from "@zenbilling/shared";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { QuoteStatus } from "@prisma/client";

export interface QuoteStatusCount {
    status: QuoteStatus;
    _count: number;
}

/**
 * Service d'agrégation et statistiques pour les devis
 * Ces endpoints sont conçus pour être appelés par le Dashboard Service
 */
export class QuoteStatsService {
    /**
     * Compte les devis du mois en cours
     */
    static async getMonthlyQuotesCount(organizationId: string): Promise<number> {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());

        logger.debug(
            { organizationId, startDate, endDate },
            "Comptage devis mensuels"
        );

        return prisma.quote.count({
            where: {
                organization_id: organizationId,
                quote_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }

    /**
     * Compte les devis de l'année en cours
     */
    static async getYearlyQuotesCount(organizationId: string): Promise<number> {
        const startDate = startOfYear(new Date());
        const endDate = endOfYear(new Date());

        logger.debug(
            { organizationId, startDate, endDate },
            "Comptage devis annuels"
        );

        return prisma.quote.count({
            where: {
                organization_id: organizationId,
                quote_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }

    /**
     * Compte les devis en attente (envoyés)
     */
    static async getPendingQuotesCount(organizationId: string): Promise<number> {
        logger.debug({ organizationId }, "Comptage devis en attente");

        return prisma.quote.count({
            where: {
                organization_id: organizationId,
                status: QuoteStatus.sent,
            },
        });
    }

    /**
     * Compte les devis acceptés
     */
    static async getAcceptedQuotesCount(
        organizationId: string
    ): Promise<number> {
        logger.debug({ organizationId }, "Comptage devis acceptés");

        return prisma.quote.count({
            where: {
                organization_id: organizationId,
                status: QuoteStatus.accepted,
            },
        });
    }

    /**
     * Obtient la distribution des devis par statut
     */
    static async getStatusDistribution(
        organizationId: string
    ): Promise<QuoteStatusCount[]> {
        logger.debug({ organizationId }, "Calcul distribution devis par statut");

        const distribution = await prisma.quote.groupBy({
            by: ["status"],
            where: {
                organization_id: organizationId,
            },
            _count: true,
        });

        // Créer un objet pour faciliter la recherche des comptes
        const statusCounts: Record<QuoteStatus, number> = {
            [QuoteStatus.draft]: 0,
            [QuoteStatus.sent]: 0,
            [QuoteStatus.accepted]: 0,
            [QuoteStatus.rejected]: 0,
            [QuoteStatus.expired]: 0,
        };

        // Remplir avec les valeurs réelles
        distribution.forEach((item) => {
            statusCounts[item.status] = item._count;
        });

        // Convertir en tableau avec tous les statuts
        return Object.entries(statusCounts).map(([status, count]) => ({
            status: status as QuoteStatus,
            _count: count,
        }));
    }

    /**
     * Obtient toutes les statistiques en une seule requête
     */
    static async getAllStats(organizationId: string) {
        logger.info({ organizationId }, "Récupération de toutes les stats devis");

        const [
            monthlyCount,
            yearlyCount,
            pendingCount,
            acceptedCount,
            statusDistribution,
        ] = await Promise.all([
            this.getMonthlyQuotesCount(organizationId),
            this.getYearlyQuotesCount(organizationId),
            this.getPendingQuotesCount(organizationId),
            this.getAcceptedQuotesCount(organizationId),
            this.getStatusDistribution(organizationId),
        ]);

        return {
            monthlyCount,
            yearlyCount,
            pendingCount,
            acceptedCount,
            statusDistribution,
        };
    }
}
