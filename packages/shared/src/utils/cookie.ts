import { Response } from "express";
import { ICookieOptions } from "../interfaces/Auth.interface";

export class CookieUtil {
    private static getDefaultOptions(isRefreshToken = false): ICookieOptions {
        return {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            domain: process.env.COOKIE_DOMAIN || undefined,
            maxAge: isRefreshToken
                ? 30 * 24 * 60 * 60 * 1000 // 30 jours pour refresh token
                : 60 * 60 * 1000, // 1 heure pour access token
            path: "/",
        };
    }

    public static setAccessTokenCookie(res: Response, token: string): void {
        try {
            res.cookie("access_token", token, this.getDefaultOptions());
        } catch (error) {
            console.error(
                "Erreur lors de la définition du cookie access_token:",
                error
            );
            throw new Error(
                "Impossible de définir le cookie d'authentification"
            );
        }
    }

    public static setRefreshTokenCookie(
        res: Response,
        refreshToken: string
    ): void {
        try {
            res.cookie(
                "refresh_token",
                refreshToken,
                this.getDefaultOptions(true)
            );
        } catch (error) {
            console.error(
                "Erreur lors de la définition du cookie refresh_token:",
                error
            );
            throw new Error(
                "Impossible de définir le cookie de rafraîchissement"
            );
        }
    }

    public static clearAuthCookies(res: Response): void {
        try {
            res.clearCookie("access_token", {
                path: "/",
                domain: process.env.COOKIE_DOMAIN || undefined,
            });
            res.clearCookie("refresh_token", {
                path: "/",
                domain: process.env.COOKIE_DOMAIN || undefined,
            });
        } catch (error) {
            console.error("Erreur lors de la suppression des cookies:", error);
            throw new Error(
                "Impossible de supprimer les cookies d'authentification"
            );
        }
    }
}
