import { Request, Response, NextFunction } from "express";
import { IUser } from "../interfaces/User.interface";
import { ApiResponse } from "../utils/apiResponse";
import logger from "../utils/logger";
import prisma from "../libs/prisma";
import { betterFetch } from "@better-fetch/fetch";
import { AuthRequest } from "../interfaces/Auth.interface";

type Session = {
    id: string;
    userId: string;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
    user: IUser;
};

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { data: session } = await betterFetch<Session>(
            "/api/auth/get-session",
            {
                baseURL: process.env.AUTH_SERVICE_URL || "",
                headers: {
                    cookie: req.headers.cookie || "",
                },
            }
        );

        if (!session) {
            logger.warn("No session found");
            ApiResponse.error(res, 401, "Non autorisé - Session manquante");
            return;
        }

        if (!session.user) {
            logger.warn("No user found in session");
            ApiResponse.error(
                res,
                401,
                "Non autorisé - Utilisateur introuvable"
            );
            return;
        }

        console.log(session.user.id);

        if (!session.user.id) {
            logger.warn("No user id found in session");
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
        console.log(error);
        logger.error({ error }, "Authentication middleware error");
        ApiResponse.error(res, 401, "Non autorisé - Token invalide");
    }
}
