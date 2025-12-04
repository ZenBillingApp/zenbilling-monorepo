import { Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { GatewayAuthRequest } from "./auth.middleware";

export function organizationRequired(
    req: GatewayAuthRequest,
    res: Response,
    next: NextFunction
) {
    if (!req.gatewayUser?.organizationId) {
        return ApiResponse.error(res, 400, "Aucune organisation sélectionnée.");
    }

    next();
}
