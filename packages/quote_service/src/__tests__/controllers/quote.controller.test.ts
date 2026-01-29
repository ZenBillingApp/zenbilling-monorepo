import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Response } from "express";
import { QuoteController } from "../../controllers/quote.controller";
import { AuthRequest } from "@zenbilling/shared";
import { QuoteService } from "../../services/quote.service";

// Mock the quote service
jest.mock("../../services/quote.service", () => ({
    QuoteService: {
        createQuote: jest.fn(),
        updateQuote: jest.fn(),
        deleteQuote: jest.fn(),
        getQuoteWithDetails: jest.fn(),
        getCompanyQuotes: jest.fn(),
        sendQuoteByEmail: jest.fn(),
        getCustomerQuotes: jest.fn(),
    },
}));

// Mock axios for PDF service
jest.mock("axios", () => ({
    post: jest.fn(),
}));

// Mock ApiResponse and other shared modules
jest.mock("@zenbilling/shared", () => ({
    ApiResponse: {
        success: jest.fn(),
        error: jest.fn(),
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

const mockQuoteService = QuoteService as jest.Mocked<typeof QuoteService>;
const mockShared = jest.requireMock("@zenbilling/shared") as any;
const ApiResponse = mockShared.ApiResponse;
const mockAxios = jest.requireMock("axios") as any;

describe("QuoteController", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            gatewayUser: {
                id: "user-123",
                sessionId: "session-123",
                organizationId: "organization-123",
            },
            body: {},
            params: {},
            query: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn().mockReturnThis() as any,
            setHeader: jest.fn() as any,
            send: jest.fn() as any,
        };
    });

    describe("createQuote", () => {
        it("should create a quote successfully", async () => {
            const quoteData = {
                customer_id: "customer-123",
                quote_date: "2024-01-01",
                validity_date: "2024-02-01",
                items: [
                    {
                        product_id: "product-123",
                        quantity: 2,
                        unit_price: 100,
                        vat_rate: "TVA_20",
                    },
                ],
                status: "draft" as const,
            };

            const createdQuote = {
                quote_id: "quote-123",
                quote_number: "DEVIS-123456-202401-001",
                ...quoteData,
                user_id: "user-123",
                company_id: "company-123",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockRequest.body = quoteData;
            mockQuoteService.createQuote.mockResolvedValue(createdQuote as any);

            await QuoteController.createQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.createQuote).toHaveBeenCalledWith(
                "user-123",
                "company-123",
                quoteData
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                201,
                "Devis créé avec succès",
                createdQuote
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await QuoteController.createQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune organisation associée à l'utilisateur"
            );
        });

        it("should handle CustomError", async () => {
            const CustomError = mockShared.CustomError;
            const error = new CustomError("Produit non trouvé", 404);
            mockQuoteService.createQuote.mockRejectedValue(error);

            await QuoteController.createQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                404,
                "Produit non trouvé"
            );
        });

        it("should handle generic errors", async () => {
            const error = new Error("Some generic error");
            mockQuoteService.createQuote.mockRejectedValue(error);

            await QuoteController.createQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                500,
                "Erreur interne du serveur"
            );
        });
    });

    describe("updateQuote", () => {
        it("should update quote successfully", async () => {
            const updateData = {
                status: "sent" as const,
                items: [
                    {
                        product_id: "product-123",
                        quantity: 3,
                        unit_price: 150,
                        vat_rate: "TVA_20",
                    },
                ],
            };

            const updatedQuote = {
                quote_id: "quote-123",
                ...updateData,
            };

            mockRequest.params = { id: "quote-123" };
            mockRequest.body = updateData;
            mockQuoteService.updateQuote.mockResolvedValue(updatedQuote as any);

            await QuoteController.updateQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.updateQuote).toHaveBeenCalledWith(
                "quote-123",
                "company-123",
                updateData
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Devis mis à jour avec succès",
                updatedQuote
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await QuoteController.updateQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune organisation associée à l'utilisateur"
            );
        });
    });

    describe("deleteQuote", () => {
        it("should delete quote successfully", async () => {
            mockRequest.params = { id: "quote-123" };
            mockQuoteService.deleteQuote.mockResolvedValue();

            await QuoteController.deleteQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.deleteQuote).toHaveBeenCalledWith(
                "quote-123",
                "company-123"
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Devis supprimé avec succès"
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await QuoteController.deleteQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune organisation associée à l'utilisateur"
            );
        });
    });

    describe("getQuote", () => {
        it("should get quote successfully", async () => {
            const quote = {
                quote_id: "quote-123",
                quote_number: "DEVIS-123456-202401-001",
                customer_id: "customer-123",
                status: "draft",
                items: [],
            };

            mockRequest.params = { id: "quote-123" };
            mockQuoteService.getQuoteWithDetails.mockResolvedValue(
                quote as any
            );

            await QuoteController.getQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.getQuoteWithDetails).toHaveBeenCalledWith(
                "quote-123",
                "company-123"
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Devis récupéré avec succès",
                quote
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await QuoteController.getQuote(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune organisation associée à l'utilisateur"
            );
        });
    });

    describe("getCompanyQuotes", () => {
        it("should get company quotes successfully", async () => {
            const queryParams = {
                page: 1,
                limit: 10,
                search: "test",
                status: "draft" as const,
            };

            const result = {
                quotes: [
                    { quote_id: "quote-1", quote_number: "DEVIS-001" },
                    { quote_id: "quote-2", quote_number: "DEVIS-002" },
                ],
                total: 2,
                totalPages: 1,
                statusCounts: {
                    draft: 1,
                    sent: 1,
                    accepted: 0,
                    rejected: 0,
                    expired: 0,
                },
            };

            mockRequest.query = queryParams as any;
            mockQuoteService.getOrganizationQuotes.mockResolvedValue(
                result as any
            );

            await QuoteController.getOrganizationQuotes(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.getOrganizationQuotes).toHaveBeenCalledWith(
                "organization-123",
                {
                    page: 1,
                    limit: 10,
                    search: "test",
                    status: "draft",
                    customer_id: undefined,
                    start_date: undefined,
                    end_date: undefined,
                    min_amount: undefined,
                    max_amount: undefined,
                    sortBy: undefined,
                    sortOrder: undefined,
                }
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Devis récupérés avec succès",
                {
                    quotes: result.quotes,
                    pagination: {
                        total: 2,
                        totalPages: 1,
                        currentPage: 1,
                        limit: 10,
                    },
                    stats: {
                        statusCounts: result.statusCounts,
                    },
                }
            );
        });
    });

    describe("downloadQuotePdf", () => {
        it("should download quote PDF successfully", async () => {
            const quote = {
                quote_id: "quote-123",
                quote_number: "DEVIS-123456-202401-001",
                company_id: "company-123",
                company: { name: "Test Company" },
            };

            const pdfBuffer = Buffer.from("PDF content");

            mockRequest.params = { id: "quote-123" };
            mockQuoteService.getQuoteWithDetails.mockResolvedValue(
                quote as any
            );
            mockAxios.post.mockResolvedValue({ data: pdfBuffer });

            process.env.PDF_SERVICE_URL = "http://localhost:3010";

            await QuoteController.downloadQuotePdf(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.getQuoteWithDetails).toHaveBeenCalledWith(
                "quote-123",
                "company-123"
            );
            expect(mockAxios.post).toHaveBeenCalledWith(
                "http://localhost:3010/api/pdf/quote",
                {
                    quote: quote,
                    company: quote.company,
                },
                {
                    responseType: "arraybuffer",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                "Content-Type",
                "application/pdf"
            );
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                "Content-Disposition",
                "attachment; filename=devis-DEVIS-123456-202401-001.pdf"
            );
            expect(mockResponse.send).toHaveBeenCalledWith(pdfBuffer);
        });

        it("should return 403 when user doesn't own the quote", async () => {
            const quote = {
                quote_id: "quote-123",
                company_id: "other-company-123", // Different company
            };

            mockRequest.params = { id: "quote-123" };
            mockQuoteService.getQuoteWithDetails.mockResolvedValue(
                quote as any
            );

            await QuoteController.downloadQuotePdf(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                403,
                "Accès non autorisé à ce devis"
            );
        });
    });

    describe("sendQuoteByEmail", () => {
        it("should send quote by email successfully", async () => {
            mockRequest.params = { id: "quote-123" };
            mockQuoteService.sendQuoteByEmail.mockResolvedValue();

            await QuoteController.sendQuoteByEmail(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.sendQuoteByEmail).toHaveBeenCalledWith(
                "quote-123",
                "organization-123",
                mockRequest.user
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Devis envoyé par email avec succès"
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await QuoteController.sendQuoteByEmail(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
        });

        it("should handle Error instances", async () => {
            const error = new Error("Email service error");
            mockQuoteService.sendQuoteByEmail.mockRejectedValue(error);

            await QuoteController.sendQuoteByEmail(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                400,
                "Email service error"
            );
        });
    });

    describe("getCustomerQuotes", () => {
        it("should get customer quotes successfully", async () => {
            const queryParams = {
                page: 1,
                limit: 5,
                status: "sent" as const,
            };

            const result = {
                quotes: [{ quote_id: "quote-1", customer_id: "customer-123" }],
                total: 1,
                totalPages: 1,
            };

            mockRequest.params = { customerId: "customer-123" };
            mockRequest.query = queryParams as any;
            mockQuoteService.getCustomerQuotes.mockResolvedValue(result as any);

            await QuoteController.getCustomerQuotes(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockQuoteService.getCustomerQuotes).toHaveBeenCalledWith(
                "customer-123",
                "company-123",
                {
                    page: 1,
                    limit: 5,
                    search: undefined,
                    status: "sent",
                    start_date: undefined,
                    end_date: undefined,
                    min_amount: undefined,
                    max_amount: undefined,
                    sortBy: undefined,
                    sortOrder: undefined,
                }
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Devis du client récupérés avec succès",
                {
                    quotes: result.quotes,
                    pagination: {
                        total: 1,
                        totalPages: 1,
                        currentPage: 1,
                        limit: 5,
                    },
                }
            );
        });
    });
});
