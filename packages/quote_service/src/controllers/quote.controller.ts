import { Response } from "express";
import { QuoteService } from "../services/quote.service";
import {
    AuthRequest,
    ApiResponse,
    CustomError,
    IQuoteQueryParams,
    logger,
    ServiceClients,
} from "@zenbilling/shared";

export class QuoteController {
    public static async createQuote(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Creating quote");

            const quote = await QuoteService.createQuote(
                req.gatewayUser!.id,
                req.gatewayUser!.organizationId!,
                req.body
            );
            logger.info({ quote }, "Quote created");
            return ApiResponse.success(
                res,
                201,
                "Devis créé avec succès",
                quote
            );
        } catch (error) {
            logger.error({ error }, "Error creating quote");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async updateQuote(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Updating quote");

            const quote = await QuoteService.updateQuote(
                req.params.id,
                req.gatewayUser!.organizationId!,
                req.body
            );
            logger.info({ quote }, "Quote updated");
            return ApiResponse.success(
                res,
                200,
                "Devis mis à jour avec succès",
                quote
            );
        } catch (error) {
            logger.error({ error }, "Error updating quote");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async deleteQuote(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Deleting quote");

            await QuoteService.deleteQuote(req.params.id, req.gatewayUser!.organizationId!);
            logger.info("Quote deleted");
            return ApiResponse.success(res, 200, "Devis supprimé avec succès");
        } catch (error) {
            logger.error({ error }, "Error deleting quote");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getQuote(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Getting quote");

            const quote = await QuoteService.getQuoteWithDetails(
                req.params.id,
                req.gatewayUser!.organizationId!
            );

            return ApiResponse.success(
                res,
                200,
                "Devis récupéré avec succès",
                quote
            );
        } catch (error) {
            logger.error({ error }, "Error getting quote");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getOrganizationQuotes(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.query }, "Getting organization quotes");

            const queryParams: IQuoteQueryParams = {
                page: req.query.page
                    ? parseInt(req.query.page as string)
                    : undefined,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : undefined,
                search: req.query.search as string,
                status: req.query.status as
                    | "draft"
                    | "sent"
                    | "accepted"
                    | "rejected"
                    | "expired",
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
                    | "quote_date"
                    | "validity_date"
                    | "amount_including_tax"
                    | "status"
                    | "quote_number",
                sortOrder: req.query.sortOrder as "ASC" | "DESC",
            };

            const result = await QuoteService.getOrganizationQuotes(
                req.gatewayUser!.organizationId!,
                queryParams
            );
            logger.info({ result }, "Organization quotes retrieved");
            return ApiResponse.success(
                res,
                200,
                "Devis récupérés avec succès",
                {
                    quotes: result.quotes,
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
            logger.error({ error }, "Error getting organization quotes");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async downloadQuotePdf(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Downloading quote pdf");
            const quoteId = req.params.id;
            const organizationId = req.gatewayUser!.organizationId!;

            const quote = await QuoteService.getQuoteWithDetails(
                quoteId,
                organizationId
            );
            logger.info({ quote }, "Quote retrieved");

            // Vérifier que l'utilisateur a accès à ce devis
            if (quote.organization_id !== organizationId) {
                return ApiResponse.error(
                    res,
                    403,
                    "Accès non autorisé à ce devis"
                );
            }

            const pdfClient = ServiceClients.getClient("pdf_service");
            const pdf = await pdfClient.post(
                "/api/pdf/quote",
                {
                    quote: quote,
                    organization: quote.organization,
                },
                {
                    responseType: "arraybuffer",
                }
            );

            // Configurer les en-têtes pour le téléchargement
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=devis-${quote.quote_number}.pdf`
            );

            return res.send(pdf.data);
        } catch (error) {
            logger.error({ error }, "Error downloading quote pdf");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async sendQuoteByEmail(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Envoi de devis par email");

            const quoteId = req.params.id;
            const organizationId = req.gatewayUser!.organizationId!;
            const userId = req.gatewayUser!.id;

            // 1. Récupérer le devis
            const quote = await QuoteService.getQuoteWithDetails(
                quoteId,
                organizationId,
            );

            // 2. Valider que le devis peut être envoyé
            QuoteService.validateQuoteForEmail(quote);

            // 3. Récupérer l'utilisateur via Auth Service
            const authClient = ServiceClients.getClient("auth_service", req);
            const userResponse = await authClient.get(`/api/users/${userId}`);
            const user = userResponse.data.data;

            if (!user) {
                throw new CustomError("Utilisateur non trouvé", 404);
            }

            // 4. Générer le PDF via PDF Service
            const pdfClient = ServiceClients.getClient("pdf_service");
            const pdfResponse = await pdfClient.post(
                "/api/pdf/quote",
                { quote, organization: quote.organization },
                { responseType: "arraybuffer" },
            );

            if (!pdfResponse.data || pdfResponse.data.byteLength === 0) {
                throw new CustomError("Erreur lors de la génération du PDF", 500);
            }

            const pdfBuffer = Buffer.from(pdfResponse.data);

            // 5. Générer le contenu HTML de l'email
            const htmlContent = QuoteService.generateQuoteEmailHtml(quote, user);

            // 6. Envoyer l'email via Email Service
            const emailClient = ServiceClients.getClient("email_service");
            await emailClient.post(
                "/api/email/send-with-attachment",
                {
                    to: [quote.customer!.email],
                    subject: `Devis ${quote.quote_number}`,
                    html: htmlContent,
                    attachment: pdfBuffer.toString("base64"),
                    filename: `devis-${quote.quote_number}.pdf`,
                },
                { maxBodyLength: Infinity, maxContentLength: Infinity },
            );

            // 7. Mettre à jour le statut si nécessaire
            if (quote.status === "draft") {
                await QuoteService.markQuoteAsSent(quoteId);
            }

            logger.info(
                { quoteId, userId, customerEmail: quote.customer?.email },
                "Devis envoyé par email avec succès",
            );

            return ApiResponse.success(
                res,
                200,
                "Devis envoyé par email avec succès",
            );
        } catch (error) {
            logger.error(
                { error, quoteId: req.params.id },
                "Erreur lors de l'envoi du devis par email",
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

    public static async getCustomerQuotes(req: AuthRequest, res: Response) {
        try {
            logger.info(
                { req: req.params, query: req.query },
                "Récupération des devis du client"
            );

            const queryParams: IQuoteQueryParams = {
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

            const result = await QuoteService.getCustomerQuotes(
                req.params.customerId,
                req.gatewayUser!.organizationId!,
                queryParams
            );

            logger.info({ result }, "Devis du client récupérés");
            return ApiResponse.success(
                res,
                200,
                "Devis du client récupérés avec succès",
                {
                    quotes: result.quotes,
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
                "Erreur lors de la récupération des devis du client"
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
