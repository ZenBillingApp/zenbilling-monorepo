import {
    ICreateQuoteRequest,
    IUpdateQuoteRequest,
    IQuoteQueryParams,
} from "@zenbilling/shared/src/interfaces/Quote.request.interface";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
// import { PdfService } from "./pdf.service";
// import emailService from "./email.service";
import { IQuote } from "@zenbilling/shared/src/interfaces/Quote.interface";
import {
    IProduct,
    vatRateToNumber,
} from "@zenbilling/shared/src/interfaces/Product.interface";
import logger from "@zenbilling/shared/src/utils/logger";
import {
    Prisma,
    PrismaClient,
    Decimal,
} from "@zenbilling/shared/src/libs/prisma";
import prisma from "@zenbilling/shared/src/libs/prisma";

export class QuoteService {
    private static generateQuoteNumber(companyId: string, date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
        const shortId = companyId.substring(0, 6);
        const quoteNumber = `DEVIS-${shortId}-${year}${month}-${random}`;
        logger.debug({ companyId, quoteNumber }, "Numéro de devis généré");
        return quoteNumber;
    }

    private static async validateProducts(
        productIds: (string | undefined)[],
        companyId: string,
        tx: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<Map<string, IProduct>> {
        const uniqueProductIds = Array.from(new Set(productIds));
        if (uniqueProductIds.length === 0) return new Map();

        const products = await tx.product.findMany({
            where: {
                product_id: {
                    in: uniqueProductIds.filter(
                        (id): id is string => id !== undefined
                    ),
                },
                company_id: companyId,
            },
        });

        if (products.length !== uniqueProductIds.length) {
            throw new CustomError(
                "Certains produits n'existent pas ou n'appartiennent pas à votre société",
                404
            );
        }

        return new Map(products.map((p: IProduct) => [p.product_id, p]));
    }

    private static async validateQuoteAccess(
        quoteId: string,
        companyId: string,
        tx: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<IQuote> {
        const quote = await tx.quote.findUnique({
            where: {
                quote_id: quoteId,
                company_id: companyId,
            },
        });

        if (!quote) {
            throw new CustomError("Devis non trouvé", 404);
        }

        return quote;
    }

    public static async createQuote(
        userId: string,
        companyId: string,
        quoteData: ICreateQuoteRequest
    ): Promise<IQuote> {
        logger.info({ userId, companyId }, "Début de création de devis");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient | PrismaClient) => {
                    let totalExcludingTax = new Decimal(0);
                    let totalTax = new Decimal(0);

                    const productIds = quoteData.items
                        .filter((item) => item.product_id)
                        .map((item) => item.product_id);

                    const productsMap = await this.validateProducts(
                        productIds,
                        companyId,
                        tx
                    );

                    // Créer le devis avec ses items en une seule transaction
                    const quote = await tx.quote.create({
                        data: {
                            customer_id: quoteData.customer_id,
                            user_id: userId,
                            company_id: companyId,
                            quote_number: this.generateQuoteNumber(
                                companyId,
                                new Date(quoteData.quote_date)
                            ),
                            quote_date: quoteData.quote_date,
                            validity_date: quoteData.validity_date,
                            amount_excluding_tax: new Decimal(0),
                            tax: new Decimal(0),
                            amount_including_tax: new Decimal(0),
                            status: "draft",
                            conditions: quoteData.conditions,
                            notes: quoteData.notes,
                            items: {
                                create: await Promise.all(
                                    quoteData.items.map(async (item) => {
                                        let itemPrice =
                                            item.unit_price_excluding_tax;
                                        let itemVatRate = item.vat_rate;
                                        let itemUnit = item.unit || "unite";
                                        let productId = null;

                                        if (item.product_id) {
                                            const product = productsMap.get(
                                                item.product_id
                                            );
                                            if (!product) {
                                                throw new CustomError(
                                                    `Le produit avec l'ID ${item.product_id} n'existe pas`,
                                                    404
                                                );
                                            }
                                            itemPrice =
                                                product.price_excluding_tax;
                                            itemVatRate = product.vat_rate;
                                            itemUnit = product.unit;
                                            productId = item.product_id;
                                        }

                                        const itemAmount = new Decimal(
                                            item.quantity
                                        ).times(new Decimal(itemPrice));
                                        const itemTax = itemAmount.times(
                                            new Decimal(
                                                vatRateToNumber(itemVatRate)
                                            ).div(100)
                                        );

                                        totalExcludingTax =
                                            totalExcludingTax.plus(itemAmount);
                                        totalTax = totalTax.plus(itemTax);

                                        if (
                                            !item.product_id &&
                                            item.save_as_product &&
                                            item.name
                                        ) {
                                            const newProduct =
                                                await tx.product.create({
                                                    data: {
                                                        company_id: companyId,
                                                        name: item.name,
                                                        description:
                                                            item.description ||
                                                            "",
                                                        price_excluding_tax:
                                                            itemPrice,
                                                        vat_rate: itemVatRate,
                                                        unit: itemUnit,
                                                    },
                                                });
                                            productId = newProduct.product_id;
                                        }

                                        return {
                                            product_id: productId,
                                            name: item.name || null,
                                            description:
                                                item.description || null,
                                            quantity: item.quantity,
                                            unit: itemUnit,
                                            unit_price_excluding_tax: itemPrice,
                                            vat_rate: itemVatRate,
                                        };
                                    })
                                ),
                            },
                        },
                    });

                    // Mettre à jour les totaux
                    const updatedQuote = await tx.quote.update({
                        where: { quote_id: quote.quote_id },
                        data: {
                            amount_excluding_tax: totalExcludingTax.toFixed(2),
                            tax: totalTax.toFixed(2),
                            amount_including_tax: totalExcludingTax
                                .plus(totalTax)
                                .toFixed(2),
                        },
                        include: {
                            items: {
                                include: {
                                    product: true,
                                },
                            },
                            customer: {
                                include: {
                                    business: true,
                                    individual: true,
                                },
                            },
                            company: true,
                        },
                    });

                    logger.info(
                        {
                            quoteId: quote.quote_id,
                            userId,
                            companyId,
                            amount: totalExcludingTax.plus(totalTax),
                        },
                        "Devis créé avec succès"
                    );

                    return updatedQuote;
                }
            );
        } catch (error) {
            console.log(error);
            logger.error(
                { error, userId, companyId },
                "Erreur lors de la création du devis"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Erreur lors de la création du devis", 500);
        }
    }

    public static async updateQuote(
        quoteId: string,
        companyId: string,
        updateData: IUpdateQuoteRequest
    ): Promise<IQuote> {
        logger.info({ quoteId, companyId }, "Début de mise à jour du devis");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const quote = await this.validateQuoteAccess(
                        quoteId,
                        companyId,
                        tx
                    );

                    if (quote.status === "accepted") {
                        throw new CustomError(
                            "Impossible de modifier un devis accepté",
                            400
                        );
                    }

                    if (quote.status === "rejected") {
                        throw new CustomError(
                            "Impossible de modifier un devis rejeté",
                            400
                        );
                    }

                    if (quote.status === "expired") {
                        throw new CustomError(
                            "Impossible de modifier un devis expiré",
                            400
                        );
                    }

                    const updatedQuote = await tx.quote.update({
                        where: { quote_id: quoteId },
                        data: updateData,
                        include: {
                            items: {
                                include: {
                                    product: true,
                                },
                            },
                            customer: {
                                include: {
                                    business: true,
                                    individual: true,
                                },
                            },
                            company: true,
                        },
                    });

                    logger.info(
                        { quoteId, companyId },
                        "Devis mis à jour avec succès"
                    );
                    return updatedQuote;
                }
            );
        } catch (error) {
            logger.error(
                { error, quoteId, companyId },
                "Erreur lors de la mise à jour du devis"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la mise à jour du devis",
                500
            );
        }
    }

    public static async getQuoteWithDetails(
        quoteId: string,
        companyId: string
    ): Promise<IQuote> {
        const quote = await prisma.quote.findUnique({
            where: {
                quote_id: quoteId,
                company_id: companyId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                customer: {
                    include: {
                        business: true,
                        individual: true,
                    },
                },
                company: true,
            },
        });

        if (!quote) {
            throw new CustomError("Devis non trouvé", 404);
        }

        return quote;
    }

    public static async deleteQuote(
        quoteId: string,
        companyId: string
    ): Promise<void> {
        logger.info({ quoteId, companyId }, "Début de suppression du devis");

        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const quote = await this.validateQuoteAccess(
                    quoteId,
                    companyId,
                    tx
                );

                if (quote.status === "accepted") {
                    throw new CustomError(
                        "Impossible de supprimer un devis accepté",
                        400
                    );
                }

                await tx.quote.delete({
                    where: { quote_id: quoteId },
                });

                logger.info(
                    { quoteId, companyId },
                    "Devis supprimé avec succès"
                );
            });
        } catch (error) {
            logger.error(
                { error, quoteId, companyId },
                "Erreur lors de la suppression du devis"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la suppression du devis",
                500
            );
        }
    }

    public static async getCompanyQuotes(
        companyId: string,
        queryParams: IQuoteQueryParams = {}
    ): Promise<{
        quotes: IQuote[];
        total: number;
        totalPages: number;
        statusCounts: {
            draft: number;
            sent: number;
            accepted: number;
            rejected: number;
            expired: number;
            total: number;
        };
    }> {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            customer_id,
            start_date,
            end_date,
            min_amount,
            max_amount,
            sortBy = "quote_date",
            sortOrder = "DESC",
        } = queryParams;

        const offset = (page - 1) * limit;
        const whereClause: any = { company_id: companyId };

        if (status) {
            whereClause.status = status;
        }

        if (customer_id) {
            whereClause.customer_id = customer_id;
        }

        if (start_date || end_date) {
            whereClause.quote_date = {
                ...(start_date && { gte: new Date(start_date).toISOString() }),
                ...(end_date && { lte: new Date(end_date).toISOString() }),
            };
        }

        if (min_amount !== undefined || max_amount !== undefined) {
            whereClause.amount_including_tax = {
                ...(min_amount !== undefined && { gte: min_amount }),
                ...(max_amount !== undefined && { lte: max_amount }),
            };
        }

        if (search) {
            const searchLower = search.toLowerCase();
            whereClause.OR = [
                {
                    quote_number: {
                        contains: searchLower,
                        mode: "insensitive",
                    },
                },
                {
                    customer: {
                        OR: [
                            {
                                email: {
                                    contains: searchLower,
                                    mode: "insensitive",
                                },
                            },
                            {
                                individual: {
                                    OR: [
                                        {
                                            first_name: {
                                                contains: searchLower,
                                                mode: "insensitive",
                                            },
                                        },
                                        {
                                            last_name: {
                                                contains: searchLower,
                                                mode: "insensitive",
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                business: {
                                    OR: [
                                        {
                                            name: {
                                                contains: searchLower,
                                                mode: "insensitive",
                                            },
                                        },
                                        {
                                            siret: {
                                                contains: searchLower,
                                                mode: "insensitive",
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ];
        }

        const [quotes, total] = await prisma.$transaction([
            prisma.quote.findMany({
                where: whereClause,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    customer: {
                        include: {
                            business: true,
                            individual: true,
                        },
                    },
                    company: true,
                },
                orderBy: {
                    [sortBy]: sortOrder.toLowerCase(),
                },
                take: limit,
                skip: offset,
            }),
            prisma.quote.count({ where: whereClause }),
        ]);

        const totalPages = Math.ceil(total / limit);

        const companyWhereClause = { company_id: companyId };
        const [
            draftCount,
            sentCount,
            acceptedCount,
            rejectedCount,
            expiredCount,
            totalCount,
        ] = await prisma.$transaction([
            prisma.quote.count({
                where: {
                    ...companyWhereClause,
                    status: "draft",
                },
            }),
            prisma.quote.count({
                where: {
                    ...companyWhereClause,
                    status: "sent",
                },
            }),
            prisma.quote.count({
                where: {
                    ...companyWhereClause,
                    status: "accepted",
                },
            }),
            prisma.quote.count({
                where: {
                    ...companyWhereClause,
                    status: "rejected",
                },
            }),
            prisma.quote.count({
                where: {
                    ...companyWhereClause,
                    status: "expired",
                },
            }),
            prisma.quote.count({
                where: companyWhereClause,
            }),
        ]);

        return {
            quotes,
            total,
            totalPages,
            statusCounts: {
                draft: draftCount,
                sent: sentCount,
                accepted: acceptedCount,
                rejected: rejectedCount,
                expired: expiredCount,
                total: totalCount,
            },
        };
    }

    // public static async sendQuoteByEmail(
    //     quoteId: string,
    //     companyId: string,
    //     userId: string
    // ): Promise<void> {
    //     logger.info(
    //         { quoteId, companyId, userId },
    //         "Début d'envoi de devis par email"
    //     );
    //     try {
    //         // Récupérer le devis avec tous les détails
    //         const quote = await this.getQuoteWithDetails(quoteId, companyId);
    //         if (!quote.customer?.email) {
    //             throw new CustomError("Le client n'a pas d'adresse email", 400);
    //         }

    //         // Récupérer l'utilisateur qui envoie l'email
    //         const user = await prisma.user.findUnique({
    //             where: { id: userId },
    //         });
    //         if (!user) {
    //             throw new CustomError("Utilisateur non trouvé", 404);
    //         }

    //         // Générer le PDF
    //         const pdfBuffer = await PdfService.generateQuotePdf(quoteId);

    //         // Préparer le contenu de l'email
    //         const customerName = quote.customer?.business
    //             ? quote.customer.business.name
    //             : `${quote.customer?.individual?.first_name} ${quote.customer?.individual?.last_name}`;

    //         const htmlContent = `
    //     <p>Bonjour ${customerName},</p>
    //     <p>Veuillez trouver ci-joint votre devis n° ${quote.quote_number}.</p>
    //     <p>Cordialement,</p>
    //     <p>${user.first_name} ${user.last_name}</p>
    //   `;

    //         // Envoyer l'email avec le devis en pièce jointe
    //         await emailService.sendEmailWithAttachment(
    //             [quote.customer?.email],
    //             `Devis ${quote.quote_number}`,
    //             htmlContent,
    //             pdfBuffer,
    //             `devis-${quote.quote_number}.pdf`,
    //             {
    //                 name: `${user.first_name} ${user.last_name}`,
    //                 email: user.email || "noreply@zenbilling.com",
    //             }
    //         );

    //         // Mettre à jour le statut du devis
    //         if (quote.status === "draft") {
    //             await prisma.quote.update({
    //                 where: { quote_id: quoteId },
    //                 data: { status: "sent" },
    //             });
    //         }

    //         logger.info(
    //             {
    //                 quoteId,
    //                 companyId,
    //                 userId,
    //                 customerEmail: quote.customer?.email,
    //             },
    //             "Devis envoyé par email avec succès"
    //         );
    //     } catch (error) {
    //         logger.error(
    //             {
    //                 error,
    //                 quoteId,
    //                 companyId,
    //                 userId,
    //             },
    //             "Erreur lors de l'envoi du devis par email"
    //         );
    //         if (error instanceof CustomError) {
    //             throw error;
    //         }
    //         throw new CustomError(
    //             "Erreur lors de l'envoi du devis par email",
    //             500
    //         );
    //     }
    // }

    public static async updateExpiredQuotes(): Promise<void> {
        logger.info("Début de la mise à jour des devis expirés");

        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Mettre à jour tous les devis dont la date de validité est passée
                await tx.quote.updateMany({
                    data: { status: "expired" },
                    where: {
                        validity_date: {
                            lt: new Date(), // Date de validité antérieure à aujourd'hui
                        },
                        status: {
                            notIn: ["expired", "accepted", "rejected"],
                        },
                    },
                });

                logger.info(
                    "Mise à jour des devis expirés terminée avec succès"
                );
            });
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la mise à jour des devis expirés"
            );
            throw new CustomError(
                "Erreur lors de la mise à jour des devis expirés",
                500
            );
        }
    }

    public static async getCustomerQuotes(
        customerId: string,
        companyId: string,
        queryParams: IQuoteQueryParams = {}
    ): Promise<{ quotes: IQuote[]; total: number; totalPages: number }> {
        logger.info(
            { customerId, companyId },
            "Récupération des devis du client"
        );
        try {
            const {
                page = 1,
                limit = 10,
                search,
                status,
                start_date,
                end_date,
                min_amount,
                max_amount,
                sortBy = "quote_date",
                sortOrder = "DESC",
            } = queryParams;

            const offset = (page - 1) * limit;
            const whereConditions: any = {
                customer_id: customerId,
                company_id: companyId,
                ...(status && { status }),
                ...(start_date && {
                    quote_date: {
                        gte: new Date(start_date),
                    },
                }),
                ...(end_date && {
                    quote_date: {
                        lte: new Date(end_date),
                    },
                }),
                ...(min_amount && {
                    amount_including_tax: {
                        gte: new Decimal(min_amount),
                    },
                }),
                ...(max_amount && {
                    amount_including_tax: {
                        lte: new Decimal(max_amount),
                    },
                }),
                ...(search && {
                    OR: [
                        {
                            quote_number: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        {
                            conditions: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        { notes: { contains: search, mode: "insensitive" } },
                    ],
                }),
            };

            const quotes = await prisma.quote.findMany({
                where: whereConditions,
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
                orderBy: {
                    [sortBy]: sortOrder.toLowerCase(),
                },
                take: limit,
                skip: offset,
            });

            const total = await prisma.quote.count({
                where: whereConditions,
            });

            const totalPages = Math.ceil(total / limit);

            logger.info(
                {
                    customerId,
                    companyId,
                    count: total,
                    page: queryParams.page || 1,
                },
                "Devis du client récupérés avec succès"
            );

            return {
                quotes,
                total,
                totalPages,
            };
        } catch (error) {
            logger.error(
                { error, customerId, companyId },
                "Erreur lors de la récupération des devis du client"
            );
            throw new CustomError(
                "Erreur lors de la récupération des devis du client",
                500
            );
        }
    }
}
