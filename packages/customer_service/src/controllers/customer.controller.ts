import { Response } from "express";
import { CustomerService } from "../services/customer.service";
import { AuthRequest } from "@zenbilling/shared";
import { ApiResponse } from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { ICustomerQueryParams } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";

export class CustomerController {
    public static async createCustomer(req: AuthRequest, res: Response) {
        try {
            logger.info({ userId: req.gatewayUser!.id }, "Creating customer");
            if (!req.gatewayUser?.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const customer = await CustomerService.createCustomer(
                req.gatewayUser.id,
                req.gatewayUser.organizationId,
                req.body
            );
            logger.info({ customer }, "Customer created");
            return ApiResponse.success(
                res,
                201,
                "Client créé avec succès",
                customer
            );
        } catch (error) {
            logger.error({ error }, "Error creating customer");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                if (error.message.includes("existe déjà")) {
                    return ApiResponse.error(res, 409, error.message);
                }
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error creating customer");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getCustomer(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Getting customer");
            if (!req.gatewayUser?.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const customer = await CustomerService.getCustomerWithDetails(
                req.params.id,
                req.gatewayUser.organizationId
            );
            logger.info({ customer }, "Customer retrieved");
            return ApiResponse.success(
                res,
                200,
                "Client récupéré avec succès",
                customer
            );
        } catch (error) {
            logger.error({ error }, "Error getting customer");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error getting customer");
                return ApiResponse.error(res, 404, error.message);
            }
            logger.error({ error }, "Error getting customer");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async updateCustomer(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Updating customer");
            if (!req.gatewayUser?.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const customer = await CustomerService.updateCustomer(
                req.params.id,
                req.gatewayUser.organizationId,
                req.body
            );
            logger.info({ customer }, "Customer updated");
            return ApiResponse.success(
                res,
                200,
                "Client mis à jour avec succès",
                customer
            );
        } catch (error) {
            logger.error({ error }, "Error updating customer");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error updating customer");
                if (error.message.includes("existe déjà")) {
                    return ApiResponse.error(res, 409, error.message);
                }
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error updating customer");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async deleteCustomer(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.params }, "Deleting customer");
            if (!req.gatewayUser?.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            await CustomerService.deleteCustomer(
                req.params.id,
                req.gatewayUser.organizationId
            );
            logger.info("Customer deleted");
            return ApiResponse.success(res, 200, "Client supprimé avec succès");
        } catch (error) {
            logger.error({ error }, "Error deleting customer");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            if (error instanceof Error) {
                logger.error({ error }, "Error deleting customer");
                return ApiResponse.error(res, 400, error.message);
            }
            logger.error({ error }, "Error deleting customer");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async getCompanyCustomers(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.query }, "Getting organization customers");
            if (!req.gatewayUser?.organizationId) {
                return ApiResponse.error(
                    res,
                    401,
                    "Aucune organisation associée à l'utilisateur"
                );
            }

            const queryParams: ICustomerQueryParams = {
                page: req.query.page
                    ? parseInt(req.query.page as string)
                    : undefined,
                limit: req.query.limit
                    ? parseInt(req.query.limit as string)
                    : undefined,
                search: req.query.search as string,
                type: req.query.type as "individual" | "company",
                sortBy: req.query.sortBy as "created_at" | "email" | "city",
                sortOrder: req.query.sortOrder as "ASC" | "DESC",
            };

            const result = await CustomerService.getCompanyCustomers(
                req.gatewayUser.organizationId,
                queryParams
            );
            logger.info({ result }, "Organization customers retrieved");
            return ApiResponse.success(
                res,
                200,
                "Clients récupérés avec succès",
                {
                    customers: result.customers,
                    pagination: {
                        total: result.total,
                        totalPages: result.totalPages,
                        currentPage: queryParams.page || 1,
                        limit: queryParams.limit || 10,
                    },
                }
            );
        } catch (error) {
            logger.error({ error }, "Error getting organization customers");
            if (error instanceof CustomError) {
                return ApiResponse.error(res, error.statusCode, error.message);
            }
            logger.error({ error }, "Error getting organization customers");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
