import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { IUser } from "@zenbilling/shared/src/interfaces/User.interface";
import { ApiResponse } from "@zenbilling/shared/src/utils/apiResponse";
import logger from "@zenbilling/shared/src/utils/logger";
import prisma from "@zenbilling/shared/src/libs/prisma";

interface AuthRequest extends Request {
    user?: IUser;
}

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
            logger.warn("No session found");
            ApiResponse.error(res, 401, "Non autorisé - Session manquante");
            return;
        }

        if (!session) {
            logger.warn("User not found for session");
            ApiResponse.error(
                res,
                401,
                "Non autorisé - Utilisateur introuvable"
            );
            return;
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
        });

        if (!user) {
            logger.warn("User not found");
            ApiResponse.error(
                res,
                401,
                "Non autorisé - Utilisateur introuvable"
            );
            return;
        }

        (req as AuthRequest).user = user;

        logger.info(
            { userId: session.user.id },
            "User authenticated successfully"
        );
        next();
    } catch (error) {
        logger.error({ error }, "Authentication middleware error");
        ApiResponse.error(res, 401, "Non autorisé - Token invalide");
    }
}
