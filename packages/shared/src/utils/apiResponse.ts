import { Response } from "express";

interface IApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Array<{ field: string; message: string }>;
}

export class ApiResponse {
    public static success<T>(
        res: Response,
        statusCode: number,
        message: string,
        data?: T
    ): Response<IApiResponse<T>> {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    public static error(
        res: Response,
        statusCode: number,
        message: string,
        errors?: Array<{ field: string; message: string }>
    ): Response<IApiResponse> {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }
}
