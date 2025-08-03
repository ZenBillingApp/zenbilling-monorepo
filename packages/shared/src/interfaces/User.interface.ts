import { OnboardingStep } from "@prisma/client";

export interface IUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    first_name: string;
    last_name: string;
    company_id?: string | null;
    onboarding_completed: boolean;
    onboarding_step: OnboardingStep;
    stripe_account_id?: string | null;
    stripe_onboarded: boolean;
}

export interface UserUpdateInput {
    name?: string;
    email?: string;
    emailVerified?: boolean;
    image?: string | null;
    first_name?: string;
    last_name?: string;
    company_id?: string | null;
    onboarding_completed?: boolean;
    onboarding_step?: OnboardingStep;
    stripe_account_id?: string | null;
    stripe_onboarded?: boolean;
}

export interface IUpdateUserRequest {
    first_name?: string;
    last_name?: string;
}

export interface IUserResponse {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    first_name: string;
    last_name: string;
    image: string | null;
    company_id: string | null;
    onboarding_completed: boolean;
    onboarding_step: OnboardingStep;
    stripe_account_id: string | null;
    stripe_onboarded: boolean;
    createdAt: Date;
    updatedAt: Date;
}
