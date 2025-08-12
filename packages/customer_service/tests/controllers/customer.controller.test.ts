import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { CustomerController } from "../../src/controllers/customer.controller";

// Mock des services
jest.mock("../../src/services/customer.service");
jest.mock("@zenbilling/shared/src/utils/apiResponse");

const mockCustomerService = require("../../src/services/customer.service").CustomerService;
const mockApiResponse = require("@zenbilling/shared/src/utils/apiResponse").ApiResponse;

jest.mock("@zenbilling/shared/src/utils/logger", () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
    },
    info: jest.fn(),
    error: jest.fn(),
}));

describe("CustomerController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        req = {
            user: {
                id: 'user-123',
                company_id: 'company-123',
            },
            body: {},
            params: {},
            query: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe("createCustomer", () => {
        it("should create a customer successfully", async () => {
            const mockCustomer = { customer_id: "test-id" };
            req.body = { type: "individual", email: "test@test.com" };
            mockCustomerService.createCustomer.mockResolvedValue(mockCustomer);
            mockApiResponse.success.mockReturnValue({});

            await CustomerController.createCustomer(req, res);

            expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
                "user-123",
                "company-123",
                req.body
            );
            expect(mockApiResponse.success).toHaveBeenCalledWith(
                res,
                201,
                "Client créé avec succès",
                mockCustomer
            );
        });

        it("should return 401 when user has no company_id", async () => {
            req.user.company_id = undefined;
            mockApiResponse.error.mockReturnValue({});

            await CustomerController.createCustomer(req, res);

            expect(mockApiResponse.error).toHaveBeenCalledWith(
                res,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
            expect(mockCustomerService.createCustomer).not.toHaveBeenCalled();
        });
    });

    describe("getCustomer", () => {
        it("should get a customer successfully", async () => {
            const mockCustomer = { customer_id: "customer-123" };
            req.params = { id: "customer-123" };
            mockCustomerService.getCustomerWithDetails.mockResolvedValue(mockCustomer);
            mockApiResponse.success.mockReturnValue({});

            await CustomerController.getCustomer(req, res);

            expect(mockCustomerService.getCustomerWithDetails).toHaveBeenCalledWith(
                "customer-123",
                "company-123"
            );
            expect(mockApiResponse.success).toHaveBeenCalledWith(
                res,
                200,
                "Client récupéré avec succès",
                mockCustomer
            );
        });

        it("should return 401 when user has no company_id", async () => {
            req.user.company_id = undefined;
            req.params = { id: "customer-123" };
            mockApiResponse.error.mockReturnValue({});

            await CustomerController.getCustomer(req, res);

            expect(mockApiResponse.error).toHaveBeenCalledWith(
                res,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
            expect(mockCustomerService.getCustomerWithDetails).not.toHaveBeenCalled();
        });
    });

    describe("updateCustomer", () => {
        it("should update a customer successfully", async () => {
            const mockCustomer = { customer_id: "customer-123" };
            const updateData = { email: "updated@example.com" };
            req.params = { id: "customer-123" };
            req.body = updateData;
            mockCustomerService.updateCustomer.mockResolvedValue(mockCustomer);
            mockApiResponse.success.mockReturnValue({});

            await CustomerController.updateCustomer(req, res);

            expect(mockCustomerService.updateCustomer).toHaveBeenCalledWith(
                "customer-123",
                "company-123",
                updateData
            );
            expect(mockApiResponse.success).toHaveBeenCalledWith(
                res,
                200,
                "Client mis à jour avec succès",
                mockCustomer
            );
        });

        it("should return 401 when user has no company_id", async () => {
            req.user.company_id = undefined;
            req.params = { id: "customer-123" };
            req.body = { email: "test@test.com" };
            mockApiResponse.error.mockReturnValue({});

            await CustomerController.updateCustomer(req, res);

            expect(mockApiResponse.error).toHaveBeenCalledWith(
                res,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
            expect(mockCustomerService.updateCustomer).not.toHaveBeenCalled();
        });
    });

    describe("deleteCustomer", () => {
        it("should delete a customer successfully", async () => {
            req.params = { id: "customer-123" };
            mockCustomerService.deleteCustomer.mockResolvedValue(undefined);
            mockApiResponse.success.mockReturnValue({});

            await CustomerController.deleteCustomer(req, res);

            expect(mockCustomerService.deleteCustomer).toHaveBeenCalledWith(
                "customer-123",
                "company-123"
            );
            expect(mockApiResponse.success).toHaveBeenCalledWith(
                res,
                200,
                "Client supprimé avec succès"
            );
        });

        it("should return 401 when user has no company_id", async () => {
            req.user.company_id = undefined;
            req.params = { id: "customer-123" };
            mockApiResponse.error.mockReturnValue({});

            await CustomerController.deleteCustomer(req, res);

            expect(mockApiResponse.error).toHaveBeenCalledWith(
                res,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
            expect(mockCustomerService.deleteCustomer).not.toHaveBeenCalled();
        });
    });

    describe("getCompanyCustomers", () => {
        it("should get company customers successfully", async () => {
            const mockResult = {
                customers: [],
                total: 0,
                totalPages: 0,
            };
            req.query = { page: "1", limit: "10" };
            mockCustomerService.getCompanyCustomers.mockResolvedValue(mockResult);
            mockApiResponse.success.mockReturnValue({});

            await CustomerController.getCompanyCustomers(req, res);

            expect(mockCustomerService.getCompanyCustomers).toHaveBeenCalledWith(
                "company-123",
                {
                    page: 1,
                    limit: 10,
                    search: undefined,
                    type: undefined,
                    sortBy: undefined,
                    sortOrder: undefined,
                }
            );
            expect(mockApiResponse.success).toHaveBeenCalledWith(
                res,
                200,
                "Clients récupérés avec succès",
                {
                    customers: [],
                    pagination: {
                        total: 0,
                        totalPages: 0,
                        currentPage: 1,
                        limit: 10,
                    },
                }
            );
        });

        it("should return 401 when user has no company_id", async () => {
            req.user.company_id = undefined;
            mockApiResponse.error.mockReturnValue({});

            await CustomerController.getCompanyCustomers(req, res);

            expect(mockApiResponse.error).toHaveBeenCalledWith(
                res,
                401,
                "Aucune entreprise associée à l'utilisateur"
            );
            expect(mockCustomerService.getCompanyCustomers).not.toHaveBeenCalled();
        });
    });
});