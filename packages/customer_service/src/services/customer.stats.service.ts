import { prisma, logger } from "@zenbilling/shared";
import { InvoiceStatus, QuoteStatus } from "@prisma/client";

export interface TopCustomer {
    customer_id: string;
    name: string;
    type: string;
    _count: {
        invoices: number;
        quotes: number;
    };
    invoices: Array<{ amount_including_tax: number }>;
    quotes: Array<{ amount_including_tax: number }>;
}

/**
 * Service de statistiques pour les clients
 * Ces endpoints sont conçus pour être appelés par le Dashboard Service
 */
export class CustomerStatsService {
    /**
     * Récupère les meilleurs clients par nombre de factures
     * Inclut le nombre total de factures et devis, ainsi que les montants
     */
    static async getTopCustomers(
        organizationId: string,
        limit: number = 5
    ): Promise<TopCustomer[]> {
        logger.debug(
            { organizationId, limit },
            "Récupération des top customers"
        );

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
}
