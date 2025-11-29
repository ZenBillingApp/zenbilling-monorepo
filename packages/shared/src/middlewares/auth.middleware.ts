import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { ApiResponse } from "../utils/apiResponse";
import logger from "../utils/logger";
import { AuthRequest } from "../interfaces/Auth.interface";

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Vérifier si la session existe via Better Auth
        const session = await auth.api.getSession({
            headers: req.headers as any,
        });

        if (!session) {
            logger.warn("Session manquante");
            ApiResponse.error(res, 401, "Non autorisé - Session manquante");
            return;
        }

        (req as AuthRequest).session = session;
        (req as AuthRequest).user = session.user;

        logger.info({ session }, "Session authenticated successfully");

        next();
    } catch (error) {
        logger.error({ error }, "Authentication middleware error");
        ApiResponse.error(res, 401, "Non autorisé - Token invalide");
    }
}
