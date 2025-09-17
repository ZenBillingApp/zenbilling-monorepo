import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Response } from "express";
import { CompanyController } from "../../controllers/company.controller";
import { AuthRequest } from "@zenbilling/shared";

// Mock the company service
jest.mock("../../services/company.service", () => ({
    CompanyService: {
        getAvailableLegalForms: jest.fn().mockReturnValue({
            legalForms: ["SAS", "SARL", "EURL", "SASU", "SA", "SNC", "SOCIETE_CIVILE", "ENTREPRISE_INDIVIDUELLE"]
        })
    }
}));

// Mock ApiResponse
jest.mock("@zenbilling/shared", () => ({
    ApiResponse: {
        success: jest.fn().mockReturnValue({}),
        error: jest.fn().mockReturnValue({})
    },
    CustomError: class CustomError extends Error {
        constructor(message: string, public statusCode: number) {
            super(message);
            this.name = "CustomError";
        }
    },
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe("CompanyController", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            user: {
                id: "user-123",
                name: "John Doe",
                email: "john@example.com",
                emailVerified: true,
                first_name: "John",
                last_name: "Doe",
                company_id: "company-123",
                onboarding_completed: true,
                onboarding_step: "FINISH",
                stripe_account_id: "acct_test123",
                stripe_onboarded: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn().mockReturnThis() as any,
        };
    });

    describe("getAvailableLegalForms", () => {
        it("devrait récupérer les formes légales disponibles", async () => {
            await CompanyController.getAvailableLegalForms(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            // Verify that the service method was called
            const { CompanyService } = await import("../../services/company.service");
            expect(CompanyService.getAvailableLegalForms).toHaveBeenCalled();

            // Verify that ApiResponse.success was called
            const { ApiResponse } = await import("@zenbilling/shared");
            expect(ApiResponse.success).toHaveBeenCalled();
        });

        it("devrait gérer les erreurs lors de la récupération des formes légales", async () => {
            // Mock the service to throw an error
            const { CompanyService } = await import("../../services/company.service");
            (CompanyService.getAvailableLegalForms as jest.Mock).mockImplementation(() => {
                throw new Error("Test error");
            });

            await CompanyController.getAvailableLegalForms(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            // Verify that ApiResponse.error was called
            const { ApiResponse } = await import("@zenbilling/shared");
            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                500,
                "Erreur interne du serveur"
            );
        });
    });

    describe("getCompany", () => {
        it("devrait retourner une erreur si l'utilisateur n'a pas d'entreprise", async () => {
            mockRequest.user!.company_id = null;

            await CompanyController.getCompany(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            const { ApiResponse } = await import("@zenbilling/shared");
            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
        });
    });

    describe("createCompany", () => {
        it("devrait retourner une erreur si l'utilisateur n'est pas authentifié", async () => {
            mockRequest.user = undefined;

            await CompanyController.createCompany(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            const { ApiResponse } = await import("@zenbilling/shared");
            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Non autorisé"
            );
        });
    });

    describe("updateCompany", () => {
        it("devrait retourner une erreur si l'utilisateur n'a pas d'entreprise", async () => {
            mockRequest.user!.company_id = null;

            await CompanyController.updateCompany(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            const { ApiResponse } = await import("@zenbilling/shared");
            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
        });
    });

    describe("deleteCompany", () => {
        it("devrait retourner une erreur si l'utilisateur n'a pas d'entreprise", async () => {
            mockRequest.user!.company_id = null;

            await CompanyController.deleteCompany(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            const { ApiResponse } = await import("@zenbilling/shared");
            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
        });
    });

    describe("getCompanyUsers", () => {
        it("devrait retourner une erreur si l'utilisateur n'a pas d'entreprise", async () => {
            mockRequest.user!.company_id = null;

            await CompanyController.getCompanyUsers(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            const { ApiResponse } = await import("@zenbilling/shared");
            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
        });
    });
});