import { Response } from "express";
import { CompanyService } from "../services/company.service";
import { ApiResponse } from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";
import { AuthRequest } from "@zenbilling/shared";

export class CompanyController {
    public static async createCompany(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Creating company");
            if (!req.user) {
                return ApiResponse.error(res, 401, "Non autorisé");
            }

            const company = await CompanyService.createCompany(
                req.body,
                req.user.id
            );
            logger.info({ company }, "Company created");
            return ApiResponse.success(
                res,
                201,
                "Entreprise créée avec succès",
                company
            );
        } catch (error) {
            logger.error({ error }, "Error creating company");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                if (error.message.includes("existe déjà")) {
                    return ApiResponse.error(res, 409, error.message);
                }
                return ApiResponse.error(res, 400, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getCompany(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.user }, "Getting company");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }
            logger.info({ companyId: req.user.company_id }, "Getting company");
            const company = await CompanyService.getCompany(
                req.user.company_id
            );
            logger.info({ company }, "Company retrieved");
            return ApiResponse.success(
                res,
                200,
                "Entreprise récupérée avec succès",
                company
            );
        } catch (error) {
            logger.error({ error }, "Error getting company");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error getting company");
                return ApiResponse.error(res, 404, error.message);
            }
            logger.error({ error }, "Error getting company");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async updateCompany(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Updating company");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }
            logger.info({ companyId: req.user.company_id }, "Updating company");
            const company = await CompanyService.updateCompany(
                req.user.company_id,
                req.body
            );
            logger.info({ company }, "Company updated");
            return ApiResponse.success(
                res,
                200,
                "Entreprise mise à jour avec succès",
                company
            );
        } catch (error) {
            logger.error({ error }, "Error updating company");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error updating company");
                if (error.message.includes("existe déjà")) {
                    return ApiResponse.error(res, 409, error.message);
                }
                return ApiResponse.error(res, 400, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async deleteCompany(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.user }, "Deleting company");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            await CompanyService.deleteCompany(req.user.company_id);
            logger.info("Company deleted");
            return ApiResponse.success(
                res,
                200,
                "Entreprise supprimée avec succès"
            );
        } catch (error) {
            logger.error({ error }, "Error deleting company");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error deleting company");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error deleting company");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getCompanyUsers(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.user }, "Getting company users");
            if (!req.user?.company_id) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune entreprise associée à l'utilisateur"
                );
            }

            const users = await CompanyService.getCompanyUsers(
                req.user.company_id
            );
            logger.info({ users }, "Company users retrieved");
            return ApiResponse.success(
                res,
                200,
                "Utilisateurs récupérés avec succès",
                users
            );
        } catch (error) {
            logger.error({ error }, "Error getting company users");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error getting company users");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error getting company users");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getAvailableLegalForms(
        _req: AuthRequest,
        res: Response
    ) {
        try {
            const legalForms = CompanyService.getAvailableLegalForms();
            return ApiResponse.success(
                res,
                200,
                "Formes légales disponibles",
                legalForms
            );
        } catch (error) {
            logger.error({ error }, "Error getting available legal forms");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
