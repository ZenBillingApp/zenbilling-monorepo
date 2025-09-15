import { Response } from "express";
import { QuoteService } from "../services/quote.service";
import { AuthRequest } from "@zenbilling/shared";
import { ApiResponse } from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { IQuoteQueryParams } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";
import axios from "axios";

export class QuoteController {
    public static async createQuote(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Creating quote");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            const quote = await QuoteService.createQuote(
                req.user.id,
                req.user.company_id,
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            const quote = await QuoteService.updateQuote(
                req.params.id,
                req.user.company_id,
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            await QuoteService.deleteQuote(req.params.id, req.user.company_id);
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            const quote = await QuoteService.getQuoteWithDetails(
                req.params.id,
                req.user.company_id
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

    public static async getCompanyQuotes(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.query }, "Getting company quotes");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

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

            const result = await QuoteService.getCompanyQuotes(
                req.user.company_id,
                queryParams
            );
            logger.info({ result }, "Company quotes retrieved");
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
            logger.error({ error }, "Error getting company quotes");
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

            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            const quote = await QuoteService.getQuoteWithDetails(
                quoteId,
                req.user.company_id
            );
            logger.info({ quote }, "Quote retrieved");

            // Vérifier que l'utilisateur a accès à ce devis
            if (quote.company_id !== req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    403,
                    "Accès non autorisé à ce devis"
                );
            }

            const pdf = await axios.post(
                `${process.env.PDF_SERVICE_URL}/api/pdf/quote`,
                {
                    quote: quote,
                    company: quote.company,
                },
                {
                    responseType: "arraybuffer",
                    headers: {
                        "Content-Type": "application/json",
                    },
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            await QuoteService.sendQuoteByEmail(
                req.params.id,
                req.user.company_id,
                req.user
            );

            logger.info(
                {
                    quoteId: req.params.id,
                    userId: req.user.id,
                },
                "Devis envoyé par email avec succès"
            );
            
            return ApiResponse.success(
                res,
                200,
                "Devis envoyé par email avec succès"
            );
        } catch (error) {
            logger.error(
                { error, quoteId: req.params.id },
                "Erreur lors de l'envoi du devis par email"
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
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

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
                req.user.company_id,
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
