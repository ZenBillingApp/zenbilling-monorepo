import { Response } from "express";
import { ProductService } from "../services/product.service";
import { AuthRequest } from "@zenbilling/shared";
import { ApiResponse } from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { AIProductService } from "../services/ai-product.service";
import {
    GenerateDescriptionRequest,
    GenerateDescriptionSuggestionsRequest,
} from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";

export class ProductController {
    private static aiProductService = new AIProductService();
    public static getAvailableUnits(_req: AuthRequest, res: Response) {
        try {
            logger.info("Getting available units");
            const units = ProductService.getAvailableUnits();
            return ApiResponse.success(
                res,
                200,
                "Unités récupérées avec succès",
                units
            );
        } catch (error) {
            logger.error({ error }, "Error getting available units");
            return ApiResponse.error(
                res,
                500,
                "Erreur lors de la récupération des unités"
            );
        }
    }

    public static getAvailableVatRates(_req: AuthRequest, res: Response) {
        try {
            const vatRates = ProductService.getAvailableVatRates();
            return ApiResponse.success(
                res,
                200,
                "Taux de TVA récupérés avec succès",
                vatRates
            );
        } catch (error) {
            logger.error({ error }, "Error getting available vat rates");
            return ApiResponse.error(
                res,
                500,
                "Erreur lors de la récupération des taux de TVA"
            );
        }
    }

    public static async createProduct(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Creating product");
            if (!req.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const product = await ProductService.createProduct(
                req.organizationId,
                req.body
            );
            logger.info({ product }, "Product created");
            return ApiResponse.success(
                res,
                201,
                "Produit créé avec succès",
                product
            );
        } catch (error) {
            logger.error({ error }, "Error creating product");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error creating product");
                if (error.message.includes("existe déjà")) {
                    return ApiResponse.error(res, 409, error.message);
                }
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error creating product");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async updateProduct(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Updating product");
            if (!req.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const product = await ProductService.updateProduct(
                req.params.id,
                req.organizationId,
                req.body
            );
            logger.info({ product }, "Product updated");
            return ApiResponse.success(
                res,
                200,
                "Produit mis à jour avec succès",
                product
            );
        } catch (error) {
            logger.error({ error }, "Error updating product");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error updating product");
                if (error.message.includes("existe déjà")) {
                    return ApiResponse.error(res, 409, error.message);
                }
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error updating product");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async deleteProduct(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Deleting product");
            if (!req.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            await ProductService.deleteProduct(
                req.params.id,
                req.organizationId
            );
            logger.info("Product deleted");
            return ApiResponse.success(
                res,
                200,
                "Produit supprimé avec succès"
            );
        } catch (error) {
            logger.error({ error }, "Error deleting product");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error deleting product");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error deleting product");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getProduct(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Getting product");
            if (!req.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const product = await ProductService.getProduct(
                req.params.id,
                req.organizationId
            );
            logger.info({ product }, "Product retrieved");
            return ApiResponse.success(
                res,
                200,
                "Produit récupéré avec succès",
                product
            );
        } catch (error) {
            logger.error({ error }, "Error getting product");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error getting product");
                return ApiResponse.error(res, 404, error.message);
            }
            logger.error({ error }, "Error getting product");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getCompanyProducts(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.query }, "Getting company products");
            if (!req.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const queryParams = {
                page: req.query.page
                    ? parseInt(req.query.page as string)
                    : undefined,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : undefined,
                search: req.query.search as string,
                minPrice: req.query.minPrice
                    ? parseFloat(req.query.minPrice as string)
                    : undefined,
                maxPrice: req.query.maxPrice
                    ? parseFloat(req.query.maxPrice as string)
                    : undefined,
                minVatRate: req.query.minVatRate
                    ? parseFloat(req.query.minVatRate as string)
                    : undefined,
                maxVatRate: req.query.maxVatRate
                    ? parseFloat(req.query.maxVatRate as string)
                    : undefined,
                sortBy: req.query.sortBy as
                    | "name"
                    | "price_excluding_tax"
                    | "vat_rate"
                    | "created_at",
                sortOrder: req.query.sortOrder as "ASC" | "DESC",
            };

            const result = await ProductService.getCompanyProducts(
                req.organizationId,
                queryParams
            );
            logger.info({ result }, "Company products retrieved");
            return ApiResponse.success(
                res,
                200,
                "Produits récupérés avec succès",
                {
                    products: result.products,
                    pagination: {
                        total: result.total,
                        totalPages: result.totalPages,
                        currentPage: queryParams.page || 1,
                        limit: queryParams.limit || 10,
                    },
                }
            );
        } catch (error) {
            logger.error({ error }, "Error getting company products");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            logger.error({ error }, "Error getting company products");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * Génère une description IA pour un produit
     */
    public static async generateProductDescription(
        req: AuthRequest,
        res: Response
    ) {
        try {
            logger.info(
                { req: req.body },
                "Génération de description IA pour produit"
            );

            const requestData: GenerateDescriptionRequest = req.body;

            // Validation basique
            if (
                !requestData.productName ||
                requestData.productName.trim().length === 0
            ) {
                return ApiResponse.error(
                    res,
                    400,
                    "Le nom du produit est requis"
                );
            }

            const response =
                await ProductController.aiProductService.generateProductDescription(
                    requestData
                );

            logger.info(
                {
                    productName: requestData.productName,
                    descriptionLength: response.description.length,
                },
                "Description IA générée avec succès"
            );

            return ApiResponse.success(
                res,
                200,
                "Description générée avec succès",
                response
            );
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la génération de description IA"
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                return ApiResponse.error(res, 500, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * Génère plusieurs suggestions de descriptions IA pour un produit
     */
    public static async generateProductDescriptionSuggestions(
        req: AuthRequest,
        res: Response
    ) {
        try {
            logger.info(
                { req: req.body },
                "Génération de suggestions de descriptions IA"
            );

            const requestData: GenerateDescriptionSuggestionsRequest = req.body;

            // Validation basique
            if (
                !requestData.productName ||
                requestData.productName.trim().length === 0
            ) {
                return ApiResponse.error(
                    res,
                    400,
                    "Le nom du produit est requis"
                );
            }

            if (
                requestData.count &&
                (requestData.count < 1 || requestData.count > 5)
            ) {
                return ApiResponse.error(
                    res,
                    400,
                    "Le nombre de suggestions doit être entre 1 et 5"
                );
            }

            const response =
                await ProductController.aiProductService.generateProductDescriptionSuggestions(
                    requestData
                );

            logger.info(
                {
                    productName: requestData.productName,
                    suggestionsCount: response.suggestions.length,
                },
                "Suggestions de descriptions IA générées avec succès"
            );

            return ApiResponse.success(
                res,
                200,
                "Suggestions générées avec succès",
                response
            );
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la génération de suggestions IA"
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                return ApiResponse.error(res, 500, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * Améliore une description de produit existante
     */
    public static async improveProductDescription(
        req: AuthRequest,
        res: Response
    ) {
        try {
            logger.info(
                { req: req.body },
                "Amélioration de description IA pour produit"
            );

            const { productName, currentDescription, improvements } = req.body;

            // Validation basique
            if (!productName || productName.trim().length === 0) {
                return ApiResponse.error(
                    res,
                    400,
                    "Le nom du produit est requis"
                );
            }

            if (!currentDescription || currentDescription.trim().length === 0) {
                return ApiResponse.error(
                    res,
                    400,
                    "La description actuelle est requise"
                );
            }

            const improvedDescription =
                await ProductController.aiProductService.improveProductDescription(
                    productName,
                    currentDescription,
                    improvements
                );

            const response = {
                productName,
                originalDescription: currentDescription,
                improvedDescription,
                improvedAt: new Date(),
            };

            logger.info(
                {
                    productName,
                    originalLength: currentDescription.length,
                    improvedLength: improvedDescription.length,
                },
                "Description IA améliorée avec succès"
            );

            return ApiResponse.success(
                res,
                200,
                "Description améliorée avec succès",
                response
            );
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de l'amélioration de description IA"
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                return ApiResponse.error(res, 500, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * Génère des mots-clés pour un produit
     */
    public static async generateProductKeywords(
        req: AuthRequest,
        res: Response
    ) {
        try {
            logger.info(
                { req: req.body },
                "Génération de mots-clés IA pour produit"
            );

            const { productName, description } = req.body;

            // Validation basique
            if (!productName || productName.trim().length === 0) {
                return ApiResponse.error(
                    res,
                    400,
                    "Le nom du produit est requis"
                );
            }

            const keywords =
                await ProductController.aiProductService.generateProductKeywords(
                    productName,
                    description
                );

            const response = {
                productName,
                keywords,
                generatedAt: new Date(),
            };

            logger.info(
                {
                    productName,
                    keywordsCount: keywords.length,
                },
                "Mots-clés IA générés avec succès"
            );

            return ApiResponse.success(
                res,
                200,
                "Mots-clés générés avec succès",
                response
            );
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la génération de mots-clés IA"
            );
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                return ApiResponse.error(res, 500, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * Vérifie la disponibilité du service AI
     */
    public static async checkAIService(_req: AuthRequest, res: Response) {
        try {
            const isAvailable =
                await ProductController.aiProductService.isAIServiceAvailable();

            const response = {
                aiServiceAvailable: isAvailable,
                checkedAt: new Date(),
                status: isAvailable ? "available" : "unavailable",
            };

            return ApiResponse.success(
                res,
                200,
                `Service AI ${isAvailable ? "disponible" : "non disponible"}`,
                response
            );
        } catch (error) {
            logger.error(
                { error },
                "Erreur lors de la vérification du service AI"
            );
            return ApiResponse.error(
                res,
                500,
                "Erreur lors de la vérification du service AI"
            );
        }
    }
}
