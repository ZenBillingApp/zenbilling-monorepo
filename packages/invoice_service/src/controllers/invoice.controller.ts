import { Response } from "express";
import { InvoiceService } from "../services/invoice.service";
import {
    AuthRequest,
    IOrganization,
    IUser,
    ApiResponse,
    CustomError,
    IInvoiceQueryParams,
    logger,
    ServiceClients,
} from "@zenbilling/shared";

export class InvoiceController {
    public static async createInvoice(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Creating invoice");

            const invoice = await InvoiceService.createInvoice(
                req.gatewayUser?.id!,
                req.gatewayUser?.organizationId!,
                req.body,
            );
            logger.info({ invoice }, "Invoice created");
            return ApiResponse.success(
                res,
                201,
                "Facture créée avec succès",
                invoice,
            );
        } catch (error) {
            if (error instanceof CustomError) {
                logger.error({ error }, "Error creating invoice");
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error creating invoice");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error creating invoice");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getInvoice(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Getting invoice");

            const invoice = await InvoiceService.getInvoiceWithDetails(
                req.params.id,
                req.gatewayUser?.organizationId!,
            );
            logger.info({ invoice }, "Invoice retrieved");
            return ApiResponse.success(
                res,
                200,
                "Facture récupérée avec succès",
                invoice,
            );
        } catch (error) {
            logger.error({ error }, "Error getting invoice");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error getting invoice");
                return ApiResponse.error(res, 404, error.message);
            }
            logger.error({ error }, "Error getting invoice");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async updateInvoice(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Updating invoice");

            const invoice = await InvoiceService.updateInvoice(
                req.params.id,
                req.gatewayUser?.organizationId!,
                req.body,
            );
            logger.info({ invoice }, "Invoice updated");
            return ApiResponse.success(
                res,
                200,
                "Facture mise à jour avec succès",
                invoice,
            );
        } catch (error) {
            logger.error({ error }, "Error updating invoice");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error updating invoice");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error updating invoice");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async deleteInvoice(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Deleting invoice");

            await InvoiceService.deleteInvoice(
                req.params.id,
                req.gatewayUser?.organizationId!,
            );
            logger.info("Invoice deleted");
            return ApiResponse.success(
                res,
                204,
                "Facture supprimée avec succès",
            );
        } catch (error) {
            logger.error({ error }, "Error deleting invoice");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error deleting invoice");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error deleting invoice");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getOrganizationInvoices(
        req: AuthRequest,
        res: Response,
    ) {
        try {
            logger.info({ req: req.query }, "Getting organization invoices");

            const queryParams: IInvoiceQueryParams = {
                page: req.query.page
                    ? parseInt(req.query.page as string)
                    : undefined,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : undefined,
                search: req.query.search as string,
                status: req.query.status as "pending" | "paid" | "cancelled",
                customer_id: req.query.customer_id
                    ? (req.query.customer_id as string)
                    : undefined,
                start_date: req.query.start_date as string,
                end_date: req.query.end_date as string,
                min_amount: req.query.min_amount
                    ? parseFloat(req.query.min_amount as string)
                    : undefined,
                max_amount: req.query.max_amount
                    ? parseFloat(req.query.max_amount as string)
                    : undefined,
                sortBy: req.query.sortBy as
                    | "invoice_date"
                    | "due_date"
                    | "amount_including_tax"
                    | "status"
                    | "invoice_number",
                sortOrder: req.query.sortOrder as "ASC" | "DESC",
            };

            const result = await InvoiceService.getOrganizationInvoices(
                req.gatewayUser?.organizationId!,
                queryParams,
            );
            logger.info({ result }, "Organization invoices retrieved");
            return ApiResponse.success(
                res,
                200,
                "Factures récupérées avec succès",
                {
                    invoices: result.invoices,
                    pagination: {
                        total: result.total,
                        totalPages: result.totalPages,
                        currentPage: queryParams.page || 1,
                        limit: queryParams.limit || 10,
                    },
                    stats: {
                        statusCounts: result.statusCounts,
                    },
                },
            );
        } catch (error) {
            logger.error({ error }, "Error getting organization invoices");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            logger.error({ error }, "Error getting organization invoices");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async createPayment(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Creating payment");

            const payment = await InvoiceService.createPayment(
                req.params.id,
                req.gatewayUser?.organizationId!,
                req.body,
            );
            logger.info({ payment }, "Payment created");
            return ApiResponse.success(
                res,
                201,
                "Paiement créé avec succès",
                payment,
            );
        } catch (error) {
            logger.error({ error }, "Error creating payment");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error creating payment");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error creating payment");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async generateInvoicePdf(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Downloading invoice PDF");
            const invoiceId = req.params.id;

            const invoice = await InvoiceService.getInvoiceWithDetails(
                invoiceId,
                req.gatewayUser?.organizationId!,
            );

            // Vérifier que l'utilisateur a accès à cette facture
            if (invoice.organization_id !== req.gatewayUser?.organizationId) {
                return ApiResponse.error(
                    res,
                    403,
                    "Accès non autorisé à cette facture",
                );
            }

            const pdfClient = ServiceClients.getClient("pdf_service");
            const pdf = await pdfClient.post(
                "/api/pdf/invoice",
                {
                    invoice: invoice,
                    organization: invoice.organization,
                },
                {
                    responseType: "arraybuffer",
                },
            );

            // Vérifier que la réponse contient des données
            if (!pdf.data || pdf.data.byteLength === 0) {
                throw new CustomError(
                    "Erreur lors de la génération du PDF",
                    500,
                );
            }

            const pdfBuffer = Buffer.from(pdf.data);

            // Configurer les en-têtes pour le téléchargement
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=facture-${invoice.invoice_number}.pdf`,
            );
            res.setHeader("Content-Length", pdfBuffer.length.toString());

            logger.info(
                { invoice_id: invoiceId, buffer_size: pdfBuffer.length },
                "PDF généré et envoyé avec succès",
            );

            return res.send(pdfBuffer);
        } catch (error) {
            logger.error({ error }, "Error downloading invoice PDF");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error downloading invoice PDF");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error downloading invoice PDF");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async sendInvoiceByEmail(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Envoi de facture par email");

            const invoiceId = req.params.id;
            const organizationId = req.gatewayUser?.organizationId!;
            const userId = req.gatewayUser?.id!;

            // 1. Récupérer la facture
            const invoice = await InvoiceService.getInvoiceWithDetails(
                invoiceId,
                organizationId,
            );

            // 2. Valider que la facture peut être envoyée
            InvoiceService.validateInvoiceForEmail(invoice);

            // 3. Récupérer l'utilisateur via Auth Service
            const authClient = ServiceClients.getClient("auth_service", req);
            const userResponse = await authClient.get(`/api/users/${userId}`);
            const user = userResponse.data.data as IUser;

            if (!user) {
                throw new CustomError("Utilisateur non trouvé", 404);
            }

            // 4. Générer le PDF via PDF Service
            const pdfClient = ServiceClients.getClient("pdf_service");
            const pdfResponse = await pdfClient.post(
                "/api/pdf/invoice",
                { invoice, organization: invoice.organization },
                { responseType: "arraybuffer" },
            );

            if (!pdfResponse.data || pdfResponse.data.byteLength === 0) {
                throw new CustomError("Erreur lors de la génération du PDF", 500);
            }

            const pdfBuffer = Buffer.from(pdfResponse.data);

            // 5. Générer le contenu HTML de l'email
            const htmlContent = InvoiceService.generateInvoiceEmailHtml(invoice, user);

            // 6. Envoyer l'email via Email Service
            const emailClient = ServiceClients.getClient("email_service");
            await emailClient.post(
                "/api/email/send-with-attachment",
                {
                    to: [invoice.customer!.email],
                    subject: `Facture ${invoice.invoice_number}`,
                    html: htmlContent,
                    attachment: pdfBuffer.toString("base64"),
                    filename: `facture-${invoice.invoice_number}.pdf`,
                },
                { maxBodyLength: Infinity, maxContentLength: Infinity },
            );

            // 7. Mettre à jour le statut si nécessaire
            if (invoice.status === "pending") {
                await InvoiceService.markInvoiceAsSent(invoiceId);
            }

            logger.info(
                { invoiceId, userId, customerEmail: invoice.customer?.email },
                "Facture envoyée par email avec succès",
            );

            return ApiResponse.success(
                res,
                200,
                "Facture envoyée par email avec succès",
            );
        } catch (error) {
            logger.error(
                { error, invoiceId: req.params.id },
                "Erreur lors de l'envoi de la facture par email",
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                return ApiResponse.error(res, 400, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async sendInvoiceWithPaymentLink(
        req: AuthRequest,
        res: Response,
    ) {
        try {
            logger.info(
                { req: req.params },
                "Envoi de facture par email avec lien de paiement",
            );

            const invoiceId = req.params.id;
            const organizationId = req.gatewayUser?.organizationId!;
            const userId = req.gatewayUser?.id!;
            const { successUrl, cancelUrl } = req.body;

            // Validation des URLs
            if (!successUrl || !cancelUrl) {
                return ApiResponse.error(
                    res,
                    400,
                    "Les URLs de succès et d'annulation sont requises pour inclure un lien de paiement",
                );
            }

            try {
                new URL(successUrl);
                new URL(cancelUrl);
            } catch {
                return ApiResponse.error(
                    res,
                    400,
                    "Les URLs fournies ne sont pas valides",
                );
            }

            // 1. Récupérer l'organisation via Auth Service
            const authClient = ServiceClients.getClient("auth_service", req);
            const orgResponse = await authClient.get(
                `/api/organizations/${organizationId}`,
            );
            const organization = orgResponse.data.data as IOrganization;

            // 2. Valider la configuration Stripe
            InvoiceService.validateOrganizationStripe(organization);

            // 3. Récupérer l'utilisateur via Auth Service
            const userResponse = await authClient.get(`/api/users/${userId}`);
            const user = userResponse.data.data as IUser;

            // 4. Récupérer la facture
            const invoice = await InvoiceService.getInvoiceWithDetails(
                invoiceId,
                organizationId,
            );

            // 5. Valider que la facture peut être envoyée
            InvoiceService.validateInvoiceForEmail(invoice);

            // 6. Générer le PDF via PDF Service
            const pdfClient = ServiceClients.getClient("pdf_service");
            const pdfResponse = await pdfClient.post(
                "/api/pdf/invoice",
                { invoice, organization: invoice.organization },
                { responseType: "arraybuffer" },
            );

            if (!pdfResponse.data || pdfResponse.data.byteLength === 0) {
                throw new CustomError("Erreur lors de la génération du PDF", 500);
            }

            const pdfBuffer = Buffer.from(pdfResponse.data);

            // 7. Créer la session de paiement Stripe via Stripe Service
            const stripeClient = ServiceClients.getClient("stripe_service");
            const stripeResponse = await stripeClient.post(
                "/api/stripe/create-checkout-session",
                {
                    amount: Math.round(Number(invoice.amount_including_tax) * 100),
                    currency: "eur",
                    description: `Facture ${invoice.invoice_number}`,
                    connectedAccountId: organization.stripe_account_id,
                    applicationFeeAmount: Math.round(
                        Number(invoice.amount_including_tax) * 100 * 0.029,
                    ),
                    invoiceId,
                    customerEmail: invoice.customer!.email,
                    successUrl,
                    cancelUrl,
                },
            );

            const paymentLink = stripeResponse.data.data.url;

            // 8. Générer le contenu HTML de l'email avec lien de paiement
            const htmlContent = InvoiceService.generateInvoiceEmailHtml(
                invoice,
                user,
                paymentLink,
            );

            // 9. Envoyer l'email via Email Service
            const emailClient = ServiceClients.getClient("email_service");
            await emailClient.post(
                "/api/email/send-with-attachment",
                {
                    to: [invoice.customer!.email],
                    subject: `Facture ${invoice.invoice_number} - Paiement en ligne disponible`,
                    html: htmlContent,
                    attachment: pdfBuffer.toString("base64"),
                    filename: `facture-${invoice.invoice_number}.pdf`,
                },
                { maxBodyLength: Infinity, maxContentLength: Infinity },
            );

            // 10. Mettre à jour le statut si nécessaire
            if (invoice.status === "pending") {
                await InvoiceService.markInvoiceAsSent(invoiceId);
            }

            logger.info(
                {
                    invoiceId,
                    userId,
                    customerEmail: invoice.customer?.email,
                    paymentLinkCreated: true,
                },
                "Facture envoyée par email avec lien de paiement avec succès",
            );

            return ApiResponse.success(
                res,
                200,
                "Facture envoyée par email avec lien de paiement avec succès",
            );
        } catch (error) {
            logger.error(
                { error, invoiceId: req.params.id },
                "Erreur lors de l'envoi de la facture par email avec lien de paiement",
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                return ApiResponse.error(res, 400, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    // /**
    //  * Envoie une facture par email avec un lien de paiement optionnel
    //  */
    // public static async sendInvoiceByEmailWithPaymentLink(
    //     req: AuthRequest,
    //     res: Response
    // ) {
    //     try {
    //         logger.info(
    //             { req: req.params, body: req.body },
    //             "Envoi de facture par email avec lien de paiement optionnel"
    //         );

    //         if (!req.user?.company_id) {
    //             return ApiResponse.error(
    //                 res,
    //                 401,
    //                 "Aucune entreprise associée à l'utilisateur"
    //             );
    //         }

    //         const options: ISendInvoiceWithPaymentLinkRequest = req.body;

    //         // Validation des URLs si lien de paiement demandé
    //         if (options.includePaymentLink) {
    //             if (!options.successUrl || !options.cancelUrl) {
    //                 return ApiResponse.error(
    //                     res,
    //                     400,
    //                     "Les URLs de succès et d'annulation sont requises pour inclure un lien de paiement"
    //                 );
    //             }

    //             // Validation basique des URLs
    //             try {
    //                 new URL(options.successUrl);
    //                 new URL(options.cancelUrl);
    //             } catch {
    //                 return ApiResponse.error(
    //                     res,
    //                     400,
    //                     "Les URLs fournies ne sont pas valides"
    //                 );
    //             }
    //         }

    //         await InvoiceService.sendInvoiceByEmailWithPaymentLink(
    //             req.params.id,
    //             req.user.company_id,
    //             req.user.id,
    //             options
    //         );

    //         const message = options.includePaymentLink
    //             ? "Facture envoyée par email avec lien de paiement avec succès"
    //             : "Facture envoyée par email avec succès";

    //         logger.info("Invoice sent by email with payment link");
    //         return ApiResponse.success(res, 200, message);
    //     } catch (error) {
    //         logger.error(
    //             { error },
    //             "Error sending invoice by email with payment link"
    //         );
    //         if (error instanceof CustomError) {
    //             return ApiResponse.error(res, error.statusCode, error.message);
    //         }
    //         logger.error(
    //             { error },
    //             "Error sending invoice by email with payment link"
    //         );
    //         return ApiResponse.error(res, 500, "Erreur interne du serveur");
    //     }
    // }

    public static async getCustomerInvoices(req: AuthRequest, res: Response) {
        try {
            logger.info(
                { req: req.params, query: req.query },
                "Récupération des factures du client",
            );

            const queryParams: IInvoiceQueryParams = {
                page: req.query.page
                    ? parseInt(req.query.page as string)
                    : undefined,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : undefined,
                search: req.query.search as string,
                status: req.query.status as any,
                start_date: req.query.start_date as string,
                end_date: req.query.end_date as string,
                min_amount: req.query.min_amount
                    ? parseFloat(req.query.min_amount as string)
                    : undefined,
                max_amount: req.query.max_amount
                    ? parseFloat(req.query.max_amount as string)
                    : undefined,
                sortBy: req.query.sortBy as any,
                sortOrder: req.query.sortOrder as "ASC" | "DESC",
            };

            const result = await InvoiceService.getCustomerInvoices(
                req.params.customerId,
                req.gatewayUser?.organizationId!,
                queryParams,
            );

            logger.info({ result }, "Factures du client récupérées");
            return ApiResponse.success(
                res,
                200,
                "Factures du client récupérées avec succès",
                {
                    invoices: result.invoices,
                    pagination: {
                        total: result.total,
                        totalPages: result.totalPages,
                        currentPage: queryParams.page || 1,
                        limit: queryParams.limit || 10,
                    },
                },
            );
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la récupération des factures du client",
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
