export interface IUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    company_id?: string;
    onboarding_completed: boolean;
    onboarding_step?: string;
    stripe_onboarded: boolean;
    stripe_account_id?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUpdateUserRequest {
    first_name?: string;
    last_name?: string;
    company_id?: string;
    onboarding_step?: string;
}

export interface IUserResponse extends IUser {}