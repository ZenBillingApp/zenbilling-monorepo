import prisma from "@zenbilling/shared/src/libs/prisma";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { InvoiceStatus, QuoteStatus } from "@prisma/client";
import {
    DashboardMetrics,
    TopCustomer,
    InvoiceStatusCount,
    QuoteStatusCount,
} from "@zenbilling/shared/src/interfaces/dashboard.interface";

export class DashboardService {
    async getMonthlyRevenue(userId: string): Promise<number> {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());

        const revenue = await prisma.invoice.aggregate({
            where: {
                user_id: userId,
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

    async getYearlyRevenue(userId: string): Promise<number> {
        const startDate = startOfYear(new Date());
        const endDate = endOfYear(new Date());

        const revenue = await prisma.invoice.aggregate({
            where: {
                user_id: userId,
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

    async getPendingInvoices(userId: string): Promise<number> {
        return prisma.invoice.count({
            where: {
                user_id: userId,
                status: InvoiceStatus.pending,
            },
        });
    }

    async getOverdueInvoices(userId: string): Promise<number> {
        return prisma.invoice.count({
            where: {
                user_id: userId,
                status: InvoiceStatus.late,
            },
        });
    }

    async getTopCustomers(
        userId: string,
        limit: number = 5
    ): Promise<TopCustomer[]> {
        const customers = await prisma.customer.findMany({
            where: {
                user_id: userId,
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
        userId: string
    ): Promise<InvoiceStatusCount[]> {
        const distribution = await prisma.invoice.groupBy({
            by: ["status"],
            where: {
                user_id: userId,
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

    async getMonthlyQuotes(userId: string): Promise<number> {
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());

        return prisma.quote.count({
            where: {
                user_id: userId,
                quote_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }

    async getYearlyQuotes(userId: string): Promise<number> {
        const startDate = startOfYear(new Date());
        const endDate = endOfYear(new Date());

        return prisma.quote.count({
            where: {
                user_id: userId,
                quote_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }

    async getPendingQuotes(userId: string): Promise<number> {
        return prisma.quote.count({
            where: {
                user_id: userId,
                status: QuoteStatus.sent,
            },
        });
    }

    async getAcceptedQuotes(userId: string): Promise<number> {
        return prisma.quote.count({
            where: {
                user_id: userId,
                status: QuoteStatus.accepted,
            },
        });
    }

    async getQuoteStatusDistribution(
        userId: string
    ): Promise<QuoteStatusCount[]> {
        const distribution = await prisma.quote.groupBy({
            by: ["status"],
            where: {
                user_id: userId,
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

    async getQuoteToInvoiceRatio(userId: string): Promise<number> {
        const [quotes, invoices] = await Promise.all([
            prisma.quote.count({
                where: {
                    user_id: userId,
                    status: QuoteStatus.accepted,
                },
            }),
            prisma.invoice.count({
                where: {
                    user_id: userId,
                    status: InvoiceStatus.paid,
                },
            }),
        ]);

        return invoices > 0 ? Number((quotes / invoices).toFixed(2)) : 0;
    }

    async getAllMetrics(userId: string): Promise<DashboardMetrics> {
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
            this.getMonthlyRevenue(userId),
            this.getYearlyRevenue(userId),
            this.getPendingInvoices(userId),
            this.getOverdueInvoices(userId),
            this.getTopCustomers(userId),
            this.getInvoiceStatusDistribution(userId),
            this.getMonthlyQuotes(userId),
            this.getYearlyQuotes(userId),
            this.getPendingQuotes(userId),
            this.getAcceptedQuotes(userId),
            this.getQuoteStatusDistribution(userId),
            this.getQuoteToInvoiceRatio(userId),
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
