import { OnboardingStep } from "@prisma/client";
import { IUser } from "./User.interface";
import { Request } from "express";
import { IOrganization } from "./Organization.interface";

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
        company_id?: string | null;
        onboarding_completed: boolean;
        onboarding_step: OnboardingStep;
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

export interface AuthRequest extends Request {
    user?: IUser;
    organization?: IOrganization;
}
