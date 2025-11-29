import { Response, NextFunction } from "express";
import { AuthRequest } from "../interfaces/Auth.interface";
import { ApiResponse } from "../utils/apiResponse";

export function organizationRequired(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const activeOrgId = req.session?.session?.activeOrganizationId;

    if (!activeOrgId) {
        return ApiResponse.error(res, 400, "Aucune organisation sélectionnée.");
    }

    req.organizationId = activeOrgId;

    next();
}
