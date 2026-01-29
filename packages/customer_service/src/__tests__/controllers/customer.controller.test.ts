import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Response } from "express";
import { CustomerController } from "../../controllers/customer.controller";
import { AuthRequest } from "@zenbilling/shared";
import { CustomerService } from "../../services/customer.service";

// Mock the customer service
jest.mock("../../services/customer.service", () => ({
    CustomerService: {
        createCustomer: jest.fn(),
        getCustomerWithDetails: jest.fn(),
        updateCustomer: jest.fn(),
        deleteCustomer: jest.fn(),
        getCompanyCustomers: jest.fn(),
    },
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

const mockCustomerService = CustomerService as jest.Mocked<
    typeof CustomerService
>;
const mockShared = jest.requireMock("@zenbilling/shared") as any;
const ApiResponse = mockShared.ApiResponse;

describe("CustomerController", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            gatewayUser: {
                id: "user-123",
                sessionId: "session-123",
                organizationId: "company-123",
            },
            body: {},
            params: {},
            query: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn().mockReturnThis() as any,
        };
    });

    describe("createCustomer", () => {
        it("should create a customer successfully", async () => {
            const customerData = {
                type: "individual" as const,
                email: "customer@example.com",
                phone: "123456789",
                address: "123 Main St",
                city: "Paris",
                postal_code: "75001",
                country: "France",
                individual: {
                    first_name: "Jane",
                    last_name: "Doe",
                },
            };

            const createdCustomer = {
                customer_id: "customer-123",
                ...customerData,
                user_id: "user-123",
                company_id: "company-123",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockRequest.body = customerData;
            mockCustomerService.createCustomer.mockResolvedValue(
                createdCustomer as any
            );

            await CustomerController.createCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
                "user-123",
                "company-123",
                customerData
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                201,
                "Client créé avec succès",
                createdCustomer
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await CustomerController.createCustomer(
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
            const error = new CustomError(
                "Client avec cet email existe déjà",
                409
            );
            mockCustomerService.createCustomer.mockRejectedValue(error);

            await CustomerController.createCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                409,
                "Client avec cet email existe déjà"
            );
        });

        it("should handle generic errors", async () => {
            const error = new Error("Some generic error");
            mockCustomerService.createCustomer.mockRejectedValue(error);

            await CustomerController.createCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                400,
                "Some generic error"
            );
        });
    });

    describe("getCustomer", () => {
        it("should get customer successfully", async () => {
            const customer = {
                customer_id: "customer-123",
                type: "individual",
                email: "customer@example.com",
                individual: {
                    first_name: "Jane",
                    last_name: "Doe",
                },
            };

            mockRequest.params = { id: "customer-123" };
            mockCustomerService.getCustomerWithDetails.mockResolvedValue(
                customer as any
            );

            await CustomerController.getCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(
                mockCustomerService.getCustomerWithDetails
            ).toHaveBeenCalledWith("customer-123", "company-123");
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Client récupéré avec succès",
                customer
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await CustomerController.getCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                401,
                "Aucune organisation associée à l'utilisateur"
            );
        });

        it("should handle customer not found", async () => {
            const error = new Error("Client non trouvé");
            mockCustomerService.getCustomerWithDetails.mockRejectedValue(error);

            await CustomerController.getCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                404,
                "Client non trouvé"
            );
        });
    });

    describe("updateCustomer", () => {
        it("should update customer successfully", async () => {
            const updateData = {
                email: "updated@example.com",
                phone: "987654321",
            };

            const updatedCustomer = {
                customer_id: "customer-123",
                ...updateData,
            };

            mockRequest.params = { id: "customer-123" };
            mockRequest.body = updateData;
            mockCustomerService.updateCustomer.mockResolvedValue(
                updatedCustomer as any
            );

            await CustomerController.updateCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockCustomerService.updateCustomer).toHaveBeenCalledWith(
                "customer-123",
                "company-123",
                updateData
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Client mis à jour avec succès",
                updatedCustomer
            );
        });

        it("should handle duplicate email error", async () => {
            const error = new Error("Un client avec cet email existe déjà");
            mockCustomerService.updateCustomer.mockRejectedValue(error);

            await CustomerController.updateCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(ApiResponse.error).toHaveBeenCalledWith(
                mockResponse,
                409,
                "Un client avec cet email existe déjà"
            );
        });
    });

    describe("deleteCustomer", () => {
        it("should delete customer successfully", async () => {
            mockRequest.params = { id: "customer-123" };
            mockCustomerService.deleteCustomer.mockResolvedValue();

            await CustomerController.deleteCustomer(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(mockCustomerService.deleteCustomer).toHaveBeenCalledWith(
                "customer-123",
                "company-123"
            );
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Client supprimé avec succès"
            );
        });

        it("should return 401 when user has no company", async () => {
            mockRequest.gatewayUser = { ...mockRequest.gatewayUser!, organizationId: undefined };

            await CustomerController.deleteCustomer(
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

    describe("getCompanyCustomers", () => {
        it("should get company customers successfully", async () => {
            const queryParams = {
                page: 1,
                limit: 10,
                search: "test",
                type: "individual" as const,
            };

            const result = {
                customers: [
                    { customer_id: "customer-1", email: "test1@example.com" },
                    { customer_id: "customer-2", email: "test2@example.com" },
                ],
                total: 2,
                totalPages: 1,
            };

            mockRequest.query = queryParams as any;
            mockCustomerService.getCompanyCustomers.mockResolvedValue(
                result as any
            );

            await CustomerController.getCompanyCustomers(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(
                mockCustomerService.getCompanyCustomers
            ).toHaveBeenCalledWith("organization-123", {
                page: 1,
                limit: 10,
                search: "test",
                type: "individual",
                sortBy: undefined,
                sortOrder: undefined,
            });
            expect(ApiResponse.success).toHaveBeenCalledWith(
                mockResponse,
                200,
                "Clients récupérés avec succès",
                {
                    customers: result.customers,
                    pagination: {
                        total: 2,
                        totalPages: 1,
                        currentPage: 1,
                        limit: 10,
                    },
                }
            );
        });

        it("should use default query parameters", async () => {
            const result = {
                customers: [],
                total: 0,
                totalPages: 0,
            };

            mockRequest.query = {};
            mockCustomerService.getCompanyCustomers.mockResolvedValue(
                result as any
            );

            await CustomerController.getCompanyCustomers(
                mockRequest as AuthRequest,
                mockResponse as Response
            );

            expect(
                mockCustomerService.getCompanyCustomers
            ).toHaveBeenCalledWith("organization-123", {
                page: undefined,
                limit: undefined,
                search: undefined,
                type: undefined,
                sortBy: undefined,
                sortOrder: undefined,
            });
        });
    });
});
