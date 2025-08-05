import {
    ICreateInvoiceRequest,
    IUpdateInvoiceRequest,
    ICreatePaymentRequest,
    IInvoiceQueryParams,
    ISendInvoiceWithPaymentLinkRequest,
} from "@zenbilling/shared/src/interfaces/Invoice.request.interface";
import { IInvoice } from "@zenbilling/shared/src/interfaces/Invoice.interface";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import logger from "@zenbilling/shared/src/utils/logger";
import prisma from "@zenbilling/shared/src/libs/prisma";
import {
    IProduct,
    ProductUnit,
    vatRateToNumber,
} from "@zenbilling/shared/src/interfaces/Product.interface";
import { IPayment } from "@zenbilling/shared/src/interfaces/Payment.interface";
import {
    Prisma,
    PrismaClient,
    Decimal,
} from "@zenbilling/shared/src/libs/prisma";
import axios from "axios";

export class InvoiceService {
    private static generateInvoiceNumber(
        companyId: string,
        date: Date
    ): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
        const shortId = companyId.substring(0, 6);
        const invoiceNumber = `FACT-${shortId}-${year}${month}-${random}`;
        logger.debug({ companyId, invoiceNumber }, "Numéro de facture généré");
        return invoiceNumber;
    }

    private static async validateProducts(
        productIds: string[],
        companyId: string,
        tx: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<Map<string, IProduct>> {
        const uniqueProductIds = Array.from(new Set(productIds));
        if (uniqueProductIds.length === 0) return new Map();

        const products = await tx.product.findMany({
            where: {
                product_id: { in: uniqueProductIds },
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

    private static async validateInvoiceAccess(
        invoiceId: string,
        companyId: string,
        tx: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<IInvoice> {
        const invoice = await tx.invoice.findUnique({
            where: {
                invoice_id: invoiceId,
                company_id: companyId,
            },
        });

        if (!invoice) {
            throw new CustomError("Facture non trouvée", 404);
        }

        return invoice;
    }

    public static async createInvoice(
        userId: string,
        companyId: string,
        invoiceData: ICreateInvoiceRequest
    ): Promise<IInvoice> {
        logger.info({ userId, companyId }, "Début de création de facture");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient | PrismaClient) => {
                    let totalExcludingTax = new Decimal(0);
                    let totalTax = new Decimal(0);

                    // Valider les produits existants
                    const productIds = invoiceData.items
                        .filter((item) => item.product_id)
                        .map((item) => item.product_id);

                    const productsMap = await this.validateProducts(
                        productIds as string[],
                        companyId,
                        tx
                    );

                    // Créer la facture
                    const invoice = await tx.invoice.create({
                        data: {
                            customer_id: invoiceData.customer_id,
                            user_id: userId,
                            company_id: companyId,
                            invoice_number: this.generateInvoiceNumber(
                                companyId,
                                new Date(invoiceData.invoice_date)
                            ),
                            invoice_date: invoiceData.invoice_date,
                            due_date: invoiceData.due_date,
                            amount_excluding_tax: new Decimal(0),
                            tax: new Decimal(0),
                            amount_including_tax: new Decimal(0),
                            status: "pending",
                            conditions: invoiceData.conditions,
                            late_payment_penalty:
                                invoiceData.late_payment_penalty,
                            items: {
                                create: await Promise.all(
                                    invoiceData.items.map(async (item) => {
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
                                        ).times(itemPrice);
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
                                                        unit: itemUnit as ProductUnit,
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
                    const updatedInvoice = await tx.invoice.update({
                        where: { invoice_id: invoice.invoice_id },
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
                            invoiceId: invoice.invoice_id,
                            userId,
                            companyId,
                            amount: totalExcludingTax.plus(totalTax).toFixed(2),
                        },
                        "Facture créée avec succès"
                    );

                    return updatedInvoice as IInvoice;
                }
            );
        } catch (error) {
            logger.error(
                { error, userId, companyId },
                "Erreur lors de la création de la facture"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la création de la facture",
                500
            );
        }
    }

    public static async updateInvoice(
        invoiceId: string,
        companyId: string,
        updateData: IUpdateInvoiceRequest
    ): Promise<IInvoice> {
        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient | PrismaClient) => {
                    const invoice = await this.validateInvoiceAccess(
                        invoiceId,
                        companyId,
                        tx
                    );

                    if (
                        invoice.status === "paid" &&
                        updateData.status !== "cancelled"
                    ) {
                        throw new CustomError(
                            "Impossible de modifier une facture payée",
                            400
                        );
                    }

                    if (invoice.status === "cancelled") {
                        throw new CustomError(
                            "Impossible de modifier une facture annulée",
                            400
                        );
                    }

                    const updatedInvoice = await tx.invoice.update({
                        where: { invoice_id: invoice.invoice_id },
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

                    return updatedInvoice as IInvoice;
                }
            );
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la mise à jour de la facture",
                500
            );
        }
    }

    public static async getInvoiceWithDetails(
        invoiceId: string,
        companyId: string
    ): Promise<IInvoice> {
        const invoice = await prisma.invoice.findUnique({
            where: {
                invoice_id: invoiceId,
                company_id: companyId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                payments: true,
                customer: {
                    include: {
                        business: true,
                        individual: true,
                    },
                },
                user: true,
                company: true,
            },
        });

        if (!invoice) {
            throw new CustomError("Facture non trouvée", 404);
        }

        return invoice as IInvoice;
    }

    public static async deleteInvoice(
        invoiceId: string,
        companyId: string
    ): Promise<void> {
        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const invoice = await this.validateInvoiceAccess(
                    invoiceId,
                    companyId,
                    tx
                );

                if (invoice.status === "paid") {
                    throw new CustomError(
                        "Impossible de supprimer une facture payée",
                        400
                    );
                }

                await tx.invoice.delete({
                    where: { invoice_id: invoice.invoice_id },
                });
            });
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la suppression de la facture",
                500
            );
        }
    }

    public static async getCompanyInvoices(
        companyId: string,
        queryParams: IInvoiceQueryParams = {}
    ): Promise<{
        invoices: IInvoice[];
        total: number;
        totalPages: number;
        statusCounts: {
            pending: number;
            paid: number;
            cancelled: number;
            sent: number;
            late: number;
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
            sortBy = "invoice_date",
            sortOrder = "DESC",
        } = queryParams;

        const offset = (page - 1) * limit;
        const whereClause: any = { company_id: companyId };

        // Filtre par statut
        if (status) {
            whereClause.status = status;
        }

        // Filtre par client
        if (customer_id) {
            whereClause.customer_id = customer_id;
        }

        // Filtre par date
        if (start_date || end_date) {
            whereClause.invoice_date = {
                ...(start_date && { gte: new Date(start_date).toISOString() }),
                ...(end_date && { lte: new Date(end_date).toISOString() }),
            };
        }

        // Filtre par montant
        if (min_amount !== undefined || max_amount !== undefined) {
            whereClause.amount_including_tax = {
                ...(min_amount !== undefined && { gte: min_amount }),
                ...(max_amount !== undefined && { lte: max_amount }),
            };
        }

        // Recherche
        if (search) {
            const searchLower = search.toLowerCase();
            whereClause.OR = [
                {
                    invoice_number: {
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

        // Requête pour obtenir les factures avec pagination
        const [invoices, total] = await prisma.$transaction([
            prisma.invoice.findMany({
                where: whereClause,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
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
            prisma.invoice.count({
                where: whereClause,
            }),
        ]);

        // Requête pour obtenir le comptage par statut
        const companyWhereClause = { company_id: companyId };
        const [
            pendingCount,
            paidCount,
            cancelledCount,
            sentCount,
            lateCount,
            totalCount,
        ] = await prisma.$transaction([
            prisma.invoice.count({
                where: {
                    ...companyWhereClause,
                    status: "pending",
                },
            }),
            prisma.invoice.count({
                where: {
                    ...companyWhereClause,
                    status: "paid",
                },
            }),
            prisma.invoice.count({
                where: {
                    ...companyWhereClause,
                    status: "cancelled",
                },
            }),
            prisma.invoice.count({
                where: {
                    ...companyWhereClause,
                    status: "sent",
                },
            }),
            prisma.invoice.count({
                where: {
                    ...companyWhereClause,
                    status: "late",
                },
            }),
            prisma.invoice.count({
                where: companyWhereClause,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            invoices: invoices as IInvoice[],
            total,
            totalPages,
            statusCounts: {
                pending: pendingCount,
                paid: paidCount,
                cancelled: cancelledCount,
                sent: sentCount,
                late: lateCount,
                total: totalCount,
            },
        };
    }

    public static async createPayment(
        invoiceId: string,
        companyId: string,
        paymentData: ICreatePaymentRequest
    ): Promise<IPayment> {
        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const invoice = await this.validateInvoiceAccess(
                        invoiceId,
                        companyId,
                        tx
                    );

                    if (invoice.status === "cancelled") {
                        throw new CustomError(
                            "Impossible de payer une facture annulée",
                            400
                        );
                    }

                    if (invoice.status === "paid") {
                        throw new CustomError(
                            "Cette facture est déjà payée",
                            400
                        );
                    }

                    const existingPayments = await tx.payment.aggregate({
                        where: { invoice_id: invoiceId },
                        _sum: { amount: true },
                    });

                    const totalPaid =
                        (Number(existingPayments._sum.amount) || 0) +
                        Number(paymentData.amount);

                    if (totalPaid > Number(invoice.amount_including_tax)) {
                        throw new CustomError(
                            "Le montant total des paiements ne peut pas dépasser le montant de la facture",
                            400
                        );
                    }

                    const payment = await tx.payment.create({
                        data: {
                            invoice_id: invoiceId,
                            ...paymentData,
                        },
                    });

                    if (
                        Math.abs(
                            Number(totalPaid) -
                                Number(invoice.amount_including_tax)
                        ) < 0.01
                    ) {
                        await tx.invoice.update({
                            where: { invoice_id: invoice.invoice_id },
                            data: { status: "paid" },
                        });
                    }

                    return payment;
                }
            );
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la création du paiement",
                500
            );
        }
    }

    public static async sendInvoiceByEmail(
        invoiceId: string,
        companyId: string,
        userId: string
    ): Promise<void> {
        logger.info(
            { invoiceId, companyId, userId },
            "Début d'envoi de facture par email"
        );
        try {
            // Récupérer la facture avec tous les détails
            const invoice = await this.getInvoiceWithDetails(
                invoiceId,
                companyId
            );
            if (!invoice.customer?.email) {
                throw new CustomError("Le client n'a pas d'adresse email", 400);
            }

            // Récupérer l'utilisateur qui envoie l'email
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new CustomError("Utilisateur non trouvé", 404);
            }

            // const pdf = await this.downloadInvoicePdf(invoiceId, companyId);

            // const pdfBuffer = Buffer.from(pdf.data);

            // Préparer le contenu de l'email
            const customerName = invoice.customer?.business
                ? invoice.customer?.business?.name
                : `${invoice.customer?.individual?.first_name} ${invoice.customer?.individual?.last_name}`;

            const htmlContent = `
        <p>Bonjour ${customerName},</p>
        <p>Veuillez trouver ci-joint votre facture n° ${invoice.invoice_number}.</p>
        <p>Cordialement,</p>
        <p>${user.first_name} ${user.last_name}</p>
      `;

            // Envoyer l'email avec la facture en pièce jointe
            await axios.post(
                `${process.env.EMAIL_SERVICE_URL}/api/email/send-with-attachment`,
                {
                    to: invoice.customer?.email,
                    subject: `Facture ${invoice.invoice_number}`,
                    html: htmlContent,
                    // attachment: pdfBuffer,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // Mettre à jour le statut de la facture
            if (invoice.status === "pending") {
                await prisma.invoice.update({
                    where: { invoice_id: invoiceId },
                    data: { status: "sent" },
                });
            }

            logger.info(
                {
                    invoiceId,
                    companyId,
                    userId,
                    customerEmail: invoice.customer?.email,
                },
                "Facture envoyée par email avec succès"
            );
        } catch (error) {
            console.log(error);
            logger.error(
                {
                    error,
                    invoiceId,
                    companyId,
                    userId,
                },
                "Erreur lors de l'envoi de la facture par email"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de l'envoi de la facture par email",
                500
            );
        }
    }

    // /**
    //  * Envoie une facture par email avec un lien de paiement optionnel
    //  */
    // public static async sendInvoiceByEmailWithPaymentLink(
    //     invoiceId: string,
    //     companyId: string,
    //     userId: string,
    //     options: ISendInvoiceWithPaymentLinkRequest = {}
    // ): Promise<void> {
    //     logger.info(
    //         { invoiceId, companyId, userId, options },
    //         "Début d'envoi de facture par email avec lien de paiement optionnel"
    //     );
    //     try {
    //         // Récupérer la facture avec tous les détails
    //         const invoice = await this.getInvoiceWithDetails(
    //             invoiceId,
    //             companyId
    //         );
    //         if (!invoice.customer?.email) {
    //             throw new CustomError("Le client n'a pas d'adresse email", 400);
    //         }

    //         // Récupérer l'utilisateur qui envoie l'email
    //         const user = await prisma.user.findUnique({
    //             where: { id: userId },
    //             include: { Company: true },
    //         });
    //         if (!user) {
    //             throw new CustomError("Utilisateur non trouvé", 404);
    //         }

    //         // Générer le PDF
    //         const pdfBuffer = await PdfService.generateInvoicePdf(invoiceId);

    //         // Préparer le nom du client
    //         const customerName = invoice.customer?.business
    //             ? invoice.customer?.business?.name
    //             : `${invoice.customer?.individual?.first_name} ${invoice.customer?.individual?.last_name}`;

    //         // Préparer le nom de l'entreprise
    //         const companyName =
    //             user.Company?.name || `${user.first_name} ${user.last_name}`;

    //         let htmlContent = `
    //             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    //                 <div style="text-align: center; margin-bottom: 30px;">
    //                     <h1 style="color: #333; margin-bottom: 10px;">Facture</h1>
    //                     <p style="color: #666; font-size: 16px;">Facture n° ${
    //                         invoice.invoice_number
    //                     }</p>
    //                 </div>

    //                 <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    //                     <p style="margin: 0 0 10px 0;"><strong>Bonjour ${customerName},</strong></p>
    //                     <p style="margin: 0 0 15px 0;">Veuillez trouver ci-joint votre facture n° ${
    //                         invoice.invoice_number
    //                     } d'un montant de <strong>${Number(
    //             invoice.amount_including_tax
    //         ).toFixed(2)} €</strong>.</p>
    //                     <p style="margin: 0 0 10px 0;"><strong>Date d'échéance :</strong> ${new Date(
    //                         invoice.due_date
    //                     ).toLocaleDateString("fr-FR")}</p>
    //                 </div>`;

    //         // Ajouter le lien de paiement si demandé et si l'utilisateur a Stripe configuré
    //         if (
    //             options.includePaymentLink &&
    //             options.successUrl &&
    //             options.cancelUrl
    //         ) {
    //             if (user.stripe_account_id && user.stripe_onboarded) {
    //                 try {
    //                     // Calculer les frais d'application (5%)
    //                     const applicationFeeAmount = Math.round(
    //                         Number(invoice.amount_including_tax) * 100 * 0.05
    //                     );

    //                     // Créer la session de paiement Stripe
    //                     const session =
    //                         await stripeService.createCheckoutSession(
    //                             Number(invoice.amount_including_tax) * 100, // Convertir en centimes
    //                             "eur",
    //                             `Facture ${invoice.invoice_number}`,
    //                             user.stripe_account_id,
    //                             applicationFeeAmount,
    //                             invoiceId,
    //                             invoice.customer.email!,
    //                             options.successUrl,
    //                             options.cancelUrl
    //                         );

    //                     if (session.url) {
    //                         htmlContent += `
    //                             <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
    //                                 <h3 style="color: #1976d2; margin-top: 0;">Paiement en ligne</h3>
    //                                 <p style="margin-bottom: 20px;">Pour votre commodité, vous pouvez régler cette facture directement en ligne de manière sécurisée.</p>
    //                                 <a href="${session.url}"
    //                                    style="display: inline-block; background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
    //                                     💳 Payer en ligne - ${Number(
    //                                         invoice.amount_including_tax
    //                                     ).toFixed(2)} €
    //                                 </a>
    //                                 <p style="font-size: 12px; color: #666; margin-top: 15px;">
    //                                     Paiement sécurisé via Stripe • Ce lien expire dans 24 heures
    //                                 </p>
    //                             </div>`;
    //                     }
    //                 } catch (stripeError) {
    //                     logger.warn(
    //                         { error: stripeError, invoiceId },
    //                         "Impossible de créer le lien de paiement Stripe, envoi de la facture sans lien"
    //                     );
    //                 }
    //             } else {
    //                 logger.warn(
    //                     { userId, invoiceId },
    //                     "Lien de paiement demandé mais Stripe non configuré pour cet utilisateur"
    //                 );
    //             }
    //         }

    //         htmlContent += `
    //                 <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
    //                     <p style="margin: 0 0 5px 0;">Cordialement,</p>
    //                     <p style="margin: 0; font-weight: bold;">${user.first_name} ${user.last_name}</p>
    //                     <p style="margin: 5px 0 0 0; color: #666;">${companyName}</p>
    //                 </div>
    //             </div>`;

    //         // Envoyer l'email avec la facture en pièce jointe
    //         await emailService.sendEmailWithAttachment(
    //             [invoice.customer?.email],
    //             `Facture ${invoice.invoice_number}`,
    //             htmlContent,
    //             pdfBuffer,
    //             `facture-${invoice.invoice_number}.pdf`,
    //             {
    //                 name: `${user.first_name} ${user.last_name}`,
    //                 email: user.email || "noreply@zenbilling.fr",
    //             }
    //         );

    //         // Mettre à jour le statut de la facture
    //         if (invoice.status === "pending") {
    //             await prisma.invoice.update({
    //                 where: { invoice_id: invoiceId },
    //                 data: { status: "sent" },
    //             });
    //         }

    //         logger.info(
    //             {
    //                 invoiceId,
    //                 companyId,
    //                 userId,
    //                 customerEmail: invoice.customer?.email,
    //                 paymentLinkIncluded:
    //                     options.includePaymentLink &&
    //                     user.stripe_account_id &&
    //                     user.stripe_onboarded,
    //             },
    //             "Facture envoyée par email avec succès"
    //         );
    //     } catch (error) {
    //         logger.error(
    //             {
    //                 error,
    //                 invoiceId,
    //                 companyId,
    //                 userId,
    //             },
    //             "Erreur lors de l'envoi de la facture par email avec lien de paiement"
    //         );
    //         if (error instanceof CustomError) {
    //             throw error;
    //         }
    //         throw new CustomError(
    //             "Erreur lors de l'envoi de la facture par email avec lien de paiement",
    //             500
    //         );
    //     }
    // }

    public static async updateLateInvoices(): Promise<void> {
        logger.info("Début de la mise à jour des factures en retard");

        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Mettre à jour toutes les factures dont la date d'échéance est passée
                // et dont le statut est 'pending' ou 'sent'
                await tx.invoice.updateMany({
                    data: { status: "late" },
                    where: {
                        due_date: {
                            lt: new Date(), // Date d'échéance antérieure à aujourd'hui
                        },
                        status: {
                            in: ["pending", "sent"],
                        },
                    },
                });

                logger.info(
                    "Mise à jour des factures en retard terminée avec succès"
                );
            });
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la mise à jour des factures en retard"
            );
            throw new CustomError(
                "Erreur lors de la mise à jour des factures en retard",
                500
            );
        }
    }

    public static async getCustomerInvoices(
        customerId: string,
        companyId: string,
        queryParams: IInvoiceQueryParams = {}
    ): Promise<{ invoices: IInvoice[]; total: number; totalPages: number }> {
        logger.info(
            { customerId, companyId },
            "Récupération des factures du client"
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
                sortBy = "invoice_date",
                sortOrder = "DESC",
            } = queryParams;

            const offset = (page - 1) * limit;
            const whereConditions: any = {
                customer_id: customerId,
                company_id: companyId,
                ...(status && { status }),
                ...(start_date && {
                    invoice_date: {
                        gte: new Date(start_date),
                    },
                }),
                ...(end_date && {
                    invoice_date: {
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
                            invoice_number: {
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
                    ],
                }),
            };

            const invoices = await prisma.invoice.findMany({
                where: whereConditions,
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    payments: true,
                },
                orderBy: {
                    [sortBy]: sortOrder.toLowerCase(),
                },
                take: limit,
                skip: offset,
            });

            const total = await prisma.invoice.count({
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
                "Factures du client récupérées avec succès"
            );

            return {
                invoices,
                total,
                totalPages,
            };
        } catch (error) {
            logger.error(
                { error, customerId, companyId },
                "Erreur lors de la récupération des factures du client"
            );
            throw new CustomError(
                "Erreur lors de la récupération des factures du client",
                500
            );
        }
    }
}
