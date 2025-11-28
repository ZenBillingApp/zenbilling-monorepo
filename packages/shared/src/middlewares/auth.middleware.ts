import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { IUser } from "../interfaces/User.interface";
import { ApiResponse } from "../utils/apiResponse";
import logger from "../utils/logger";
import prisma from "../lib/prisma";
import { IFullOrganization } from "../interfaces/Organization.interface";

interface AuthRequest extends Request {
    user?: IUser;
    organization?: IFullOrganization;
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

        const organization = await auth.api.getFullOrganization({
            headers: req.headers as any,
        });

        if (!organization) {
            logger.warn("Organization not found");
            ApiResponse.error(
                res,
                401,
                "Non autorisé - Organisation introuvable"
            );
            return;
        }
        (req as AuthRequest).organization = organization as IFullOrganization;
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
