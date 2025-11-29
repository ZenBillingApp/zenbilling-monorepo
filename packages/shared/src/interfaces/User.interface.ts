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
}

export interface UserUpdateInput {
    name?: string;
    email?: string;
    emailVerified?: boolean;
    image?: string | null;
    first_name?: string;
    last_name?: string;
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
    createdAt: Date;
    updatedAt: Date;
}
