import { Response } from "express";
import { InvoiceService } from "../services/invoice.service";
// import { PdfService } from "../services/pdf.service";
import { AuthRequest } from "@zenbilling/shared/src/interfaces/Auth.interface";
import { ApiResponse } from "@zenbilling/shared/src/utils/apiResponse";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import {
    IInvoiceQueryParams,
    ISendInvoiceWithPaymentLinkRequest,
} from "@zenbilling/shared/src/interfaces/Invoice.request.interface";
import logger from "@zenbilling/shared/src/utils/logger";
import axios from "axios";

export class InvoiceController {
    public static async createInvoice(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Creating invoice");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune société associée à l'utilisateur"
                );
            }
            const invoice = await InvoiceService.createInvoice(
                req.user.id,
                req.user.company_id,
                req.body
            );
            logger.info({ invoice }, "Invoice created");
            return ApiResponse.success(
                res,
                201,
                "Facture créée avec succès",
                invoice
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune société associée à l'utilisateur"
                );
            }
            const invoice = await InvoiceService.getInvoiceWithDetails(
                req.params.id,
                req.user.company_id
            );
            logger.info({ invoice }, "Invoice retrieved");
            return ApiResponse.success(
                res,
                200,
                "Facture récupérée avec succès",
                invoice
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune société associée à l'utilisateur"
                );
            }
            const invoice = await InvoiceService.updateInvoice(
                req.params.id,
                req.user.company_id,
                req.body
            );
            logger.info({ invoice }, "Invoice updated");
            return ApiResponse.success(
                res,
                200,
                "Facture mise à jour avec succès",
                invoice
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune société associée à l'utilisateur"
                );
            }
            await InvoiceService.deleteInvoice(
                req.params.id,
                req.user.company_id
            );
            logger.info("Invoice deleted");
            return ApiResponse.success(
                res,
                204,
                "Facture supprimée avec succès"
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

    public static async getCompanyInvoices(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.query }, "Getting company invoices");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

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

            const result = await InvoiceService.getCompanyInvoices(
                req.user.company_id,
                queryParams
            );
            logger.info({ result }, "Company invoices retrieved");
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
                }
            );
        } catch (error) {
            logger.error({ error }, "Error getting company invoices");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            logger.error({ error }, "Error getting company invoices");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async createPayment(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Creating payment");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune société associée à l'utilisateur"
                );
            }
            const payment = await InvoiceService.createPayment(
                req.params.id,
                req.user.company_id,
                req.body
            );
            logger.info({ payment }, "Payment created");
            return ApiResponse.success(
                res,
                201,
                "Paiement créé avec succès",
                payment
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

            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune société associée à l'utilisateur"
                );
            }

            const invoice = await InvoiceService.getInvoiceWithDetails(
                invoiceId,
                req.user.company_id
            );

            // Vérifier que l'utilisateur a accès à cette facture
            if (invoice.company_id !== req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    403,
                    "Accès non autorisé à cette facture"
                );
            }

            const pdf = await axios.post(
                `${process.env.PDF_SERVICE_URL}/api/pdf/invoice`,
                {
                    invoice: invoice,
                    company: invoice.company,
                },
                {
                    responseType: "arraybuffer",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // Vérifier que la réponse contient des données
            if (!pdf.data || pdf.data.byteLength === 0) {
                throw new CustomError(
                    "Erreur lors de la génération du PDF",
                    500
                );
            }

            const pdfBuffer = Buffer.from(pdf.data);

            // Configurer les en-têtes pour le téléchargement
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=facture-${invoice.invoice_number}.pdf`
            );
            res.setHeader("Content-Length", pdfBuffer.length.toString());

            logger.info(
                { invoice_id: invoiceId, buffer_size: pdfBuffer.length },
                "PDF généré et envoyé avec succès"
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            await InvoiceService.sendInvoiceByEmail(
                req.params.id,
                req.user.company_id,
                req.user.id
            );

            logger.info(
                {
                    invoiceId: req.params.id,
                    userId: req.user.id,
                },
                "Facture envoyée par email avec succès"
            );

            return ApiResponse.success(
                res,
                200,
                "Facture envoyée par email avec succès"
            );
        } catch (error) {
            logger.error(
                { error, invoiceId: req.params.id },
                "Erreur lors de l'envoi de la facture par email"
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
        res: Response
    ) {
        try {
            logger.info(
                { req: req.params },
                "Envoi de facture par email avec lien de paiement"
            );
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            const { successUrl, cancelUrl } = req.body;

            // Validation des URLs si lien de paiement demandé

            if (!successUrl || !cancelUrl) {
                return ApiResponse.error(
                    res,
                    400,
                    "Les URLs de succès et d'annulation sont requises pour inclure un lien de paiement"
                );
            }

            // Validation basique des URLs
            try {
                new URL(successUrl);
                new URL(cancelUrl);
            } catch {
                return ApiResponse.error(
                    res,
                    400,
                    "Les URLs fournies ne sont pas valides"
                );
            }

            await InvoiceService.sendInvoiceWithPaymentLink(
                req.params.id,
                req.user.company_id,
                req.user,
                { successUrl, cancelUrl }
            );

            const message =
                "Facture envoyée par email avec lien de paiement avec succès";

            logger.info(
                {
                    invoiceId: req.params.id,
                    userId: req.user.id,
                },
                message
            );

            return ApiResponse.success(res, 200, message);
        } catch (error) {
            logger.error(
                { error, invoiceId: req.params.id },
                "Erreur lors de l'envoi de la facture par email avec lien de paiement"
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
                "Récupération des factures du client"
            );
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune société associée à l'utilisateur"
                );
            }

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
                req.user.company_id,
                queryParams
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
                }
            );
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la récupération des factures du client"
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
