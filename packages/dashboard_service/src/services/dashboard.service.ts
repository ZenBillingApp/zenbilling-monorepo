import { prisma } from "@zenbilling/shared";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { InvoiceStatus, QuoteStatus } from "@prisma/client";
import {
    DashboardMetrics,
    TopCustomer,
    InvoiceStatusCount,
    QuoteStatusCount,
} from "@zenbilling/shared";

export class DashboardService {
    async getMonthlyRevenue(organizationId: string): Promise<number> {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());

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

    async getYearlyRevenue(organizationId: string): Promise<number> {
        const startDate = startOfYear(new Date());
        const endDate = endOfYear(new Date());

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

    async getPendingInvoices(organizationId: string): Promise<number> {
        return prisma.invoice.count({
            where: {
                organization_id: organizationId,
                status: InvoiceStatus.pending,
            },
        });
    }

    async getOverdueInvoices(organizationId: string): Promise<number> {
        return prisma.invoice.count({
            where: {
                organization_id: organizationId,
                status: InvoiceStatus.late,
            },
        });
    }

    async getTopCustomers(
        organizationId: string,
        limit: number = 5
    ): Promise<TopCustomer[]> {
        const customers = await prisma.customer.findMany({
            where: {
                organization_id: organizationId,
            },
            include: {
                _count: {
                    select: {
                        invoices: true,
                        quotes: true,
                    },
                },
                invoices: {
                    where: {
                        status: InvoiceStatus.paid,
                    },
                    select: {
                        amount_including_tax: true,
                    },
                },
                quotes: {
                    where: {
                        status: QuoteStatus.accepted,
                    },
                    select: {
                        amount_including_tax: true,
                    },
                },
                business: {
                    select: {
                        name: true,
                    },
                },
                individual: {
                    select: {
                        first_name: true,
                        last_name: true,
                    },
                },
            },
            orderBy: {
                invoices: {
                    _count: "desc",
                },
            },
            take: limit,
        });

        return customers.map((customer) => {
            // Déterminer le nom du client en fonction de son type
            let name = "";
            if (customer.type === "company" && customer.business) {
                name = customer.business.name;
            } else if (customer.type === "individual" && customer.individual) {
                name = `${customer.individual.first_name} ${customer.individual.last_name}`;
            }

            return {
                customer_id: customer.customer_id,
                name,
                type: customer.type,
                _count: customer._count,
                invoices: customer.invoices.map((invoice) => ({
                    amount_including_tax: Number(invoice.amount_including_tax),
                })),
                quotes: customer.quotes.map((quote) => ({
                    amount_including_tax: Number(quote.amount_including_tax),
                })),
            };
        });
    }

    async getInvoiceStatusDistribution(
        organizationId: string
    ): Promise<InvoiceStatusCount[]> {
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

    async getMonthlyQuotes(organizationId: string): Promise<number> {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());

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

    async getYearlyQuotes(organizationId: string): Promise<number> {
        const startDate = startOfYear(new Date());
        const endDate = endOfYear(new Date());

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

    async getPendingQuotes(organizationId: string): Promise<number> {
        return prisma.quote.count({
            where: {
                organization_id: organizationId,
                status: QuoteStatus.sent,
            },
        });
    }

    async getAcceptedQuotes(organizationId: string): Promise<number> {
        return prisma.quote.count({
            where: {
                organization_id: organizationId,
                status: QuoteStatus.accepted,
            },
        });
    }

    async getQuoteStatusDistribution(
        organizationId: string
    ): Promise<QuoteStatusCount[]> {
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

    async getQuoteToInvoiceRatio(organizationId: string): Promise<number> {
        const [quotes, invoices] = await Promise.all([
            prisma.quote.count({
                where: {
                    organization_id: organizationId,
                    status: QuoteStatus.accepted,
                },
            }),
            prisma.invoice.count({
                where: {
                    organization_id: organizationId,
                    status: InvoiceStatus.paid,
                },
            }),
        ]);

        return invoices > 0 ? Number((quotes / invoices).toFixed(2)) : 0;
    }

    async getAllMetrics(organizationId: string): Promise<DashboardMetrics> {
        const [
            monthlyRevenue,
            yearlyRevenue,
            pendingInvoices,
            overdueInvoices,
            topCustomers,
            invoiceStatusDistribution,
            monthlyQuotes,
            yearlyQuotes,
            pendingQuotes,
            acceptedQuotes,
            quoteStatusDistribution,
            quoteToInvoiceRatio,
        ] = await Promise.all([
            this.getMonthlyRevenue(organizationId),
            this.getYearlyRevenue(organizationId),
            this.getPendingInvoices(organizationId),
            this.getOverdueInvoices(organizationId),
            this.getTopCustomers(organizationId),
            this.getInvoiceStatusDistribution(organizationId),
            this.getMonthlyQuotes(organizationId),
            this.getYearlyQuotes(organizationId),
            this.getPendingQuotes(organizationId),
            this.getAcceptedQuotes(organizationId),
            this.getQuoteStatusDistribution(organizationId),
            this.getQuoteToInvoiceRatio(organizationId),
        ]);

        return {
            monthlyRevenue,
            yearlyRevenue,
            pendingInvoices,
            overdueInvoices,
            topCustomers,
            invoiceStatusDistribution,
            monthlyQuotes,
            yearlyQuotes,
            pendingQuotes,
            acceptedQuotes,
            quoteStatusDistribution,
            quoteToInvoiceRatio,
        };
    }
}
