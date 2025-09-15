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

    public static async onboardingFinish(req: AuthRequest, res: Response) {
        try {
            logger.info({ req: req.user }, "Finishing onboarding");
            if (!req.user) {
                return ApiResponse.error(res, 401, "Non autorisé");
            }

            await UserService.onboardingFinish(req.user.id);
            logger.info("Onboarding finished");
            return ApiResponse.success(
                res,
                200,
                "Onboarding terminé avec succès"
            );
        } catch (error) {
            logger.error({ error }, "Error finishing onboarding");
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    // public static async refreshToken(req: Request, res: Response) {
    //     try {
    //         logger.info({ req: req.cookies }, "Refreshing token");
    //         const refreshToken = req.cookies.refresh_token;
    //         logger.info({ refreshToken }, "Refresh token found");
    //         if (!refreshToken) {
    //             return ApiResponse.error(res, 401, "Refresh token manquant");
    //         }

    //         // Vérifier la validité du refresh token
    //         const {
    //             data: { session },
    //             error: sessionError,
    //         } = await supabase.auth.getSession();

    //         if (sessionError || !session) {
    //             logger.warn({ error: sessionError }, "Refresh token invalide");
    //             CookieUtil.clearAuthCookies(res);
    //             return ApiResponse.error(
    //                 res,
    //                 401,
    //                 "Session expirée, veuillez vous reconnecter"
    //             );
    //         }

    //         // Rafraîchir le token avec Supabase
    //         const { data, error } = await supabase.auth.refreshSession({
    //             refresh_token: refreshToken,
    //         });

    //         if (error || !data.session) {
    //             logger.warn({ error }, "Échec du rafraîchissement du token");
    //             CookieUtil.clearAuthCookies(res);
    //             return ApiResponse.error(
    //                 res,
    //                 401,
    //                 "Session expirée, veuillez vous reconnecter"
    //             );
    //         }

    //         if (data.session.access_token) {
    //             CookieUtil.setAccessTokenCookie(res, data.session.access_token);
    //         }

    //         if (data.session.refresh_token) {
    //             CookieUtil.setRefreshTokenCookie(
    //                 res,
    //                 data.session.refresh_token
    //             );
    //         }

    //         return ApiResponse.success(res, 200, "Token rafraîchi avec succès");
    //     } catch (error) {
    //         logger.error({ error }, "Erreur lors du rafraîchissement du token");
    //         CookieUtil.clearAuthCookies(res);
    //         return ApiResponse.error(res, 500, "Erreur interne du serveur");
    //     }
    // }
}
