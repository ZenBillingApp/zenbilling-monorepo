import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { IUser } from "@zenbilling/shared";
import { ApiResponse } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";

interface AuthRequest extends Request {
    user?: IUser;
}

export class UserController {
    public static async getProfile(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.user }, "Getting profile");
            if (!req.user) {
                return ApiResponse.error(res, 401, "Non autorisé");
            }

            return ApiResponse.success(
                res,
                200,
                "Profil récupéré avec succès",
                req.user
            );
        } catch (error) {
            logger.error({ error }, "Error getting profile");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async updateProfile(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.body }, "Updating profile");
            if (!req.user) {
                return ApiResponse.error(res, 401, "Non autorisé");
            }

            const updatedUser = await UserService.updateUser(
                req.user.id,
                req.body
            );
            logger.info({ updatedUser }, "Profile updated");
            return ApiResponse.success(
                res,
                200,
                "Profil mis à jour avec succès",
                updatedUser
            );
        } catch (error) {
            logger.error({ error }, "Error updating profile");
            if (error instanceof Error) {
                if (error.message.includes("existe déjà")) {
                    return ApiResponse.error(res, 409, error.message);
                }
                return ApiResponse.error(res, 400, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    public static async deleteProfile(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.user }, "Deleting profile");
            if (!req.user) {
                return ApiResponse.error(res, 401, "Non autorisé");
            }

            await UserService.deleteUser(req.user.id);
            logger.info("Profile deleted");
            return ApiResponse.success(res, 200, "Profil supprimé avec succès");
        } catch (error) {
            logger.error({ error }, "Error deleting profile");
            if (error instanceof Error) {
                return ApiResponse.error(res, 400, error.message);
            }
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
