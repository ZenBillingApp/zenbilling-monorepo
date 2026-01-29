import { Request } from "express";
import { auth } from "../lib/auth";
import { IOrganization } from "./Organization.interface";
import { IUser } from "./User.interface";

type Session = typeof auth.$Infer.Session;

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IRegisterRequest extends ILoginRequest {
    first_name: string;
    last_name: string;
}

export interface IAuthResponse {
    token: string;
    refreshToken?: string;
    expiresIn?: number;
    user: {
        user_id: string;
        email?: string | null;
        first_name: string;
        last_name: string;
    };
}

export interface ICookieOptions {
    httpOnly: boolean;
    secure?: boolean;
    sameSite: "strict" | "lax" | "none" | boolean;
    maxAge: number;
    path: string;
    domain?: string | undefined;
}

/**
 * Interface pour les requêtes authentifiées via le Gateway
 *
 * Le Gateway injecte les headers x-user-id, x-session-id, x-organization-id
 * qui sont lus par authMiddleware et attachés à gatewayUser
 *
 * @property gatewayUser - Informations utilisateur injectées par le Gateway (source primaire)
 * @property session - Session Better Auth (utilisé côté auth_service uniquement)
 * @property user - Objet utilisateur complet (optionnel, pour compatibilité)
 */
export interface AuthRequest extends Request {
    session?: Session;
    user?: IUser;
    gatewayUser?: {
        /** ID de l'utilisateur (provient de x-user-id) */
        id: string;
        /** ID de la session (provient de x-session-id) */
        sessionId: string;
        /** ID de l'organisation active (provient de x-organization-id) */
        organizationId?: string;
    };
}
