import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { CustomerService } from "../../services/customer.service";
import { CustomError } from "@zenbilling/shared";

// Mock the shared package
const mockPrisma = {
    customer: {
        create: jest.fn() as any,
        findFirst: jest.fn() as any,
        findMany: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        count: jest.fn() as any,
    },
    $transaction: jest.fn() as any,
};

const mockTransaction = {
    customer: {
        create: jest.fn() as any,
        findFirst: jest.fn() as any,
        findMany: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        count: jest.fn() as any,
    },
};

jest.mock("@zenbilling/shared", () => ({
    prisma: {
        customer: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        $transaction: jest.fn(),
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

// Get mocked modules
const { prisma } = jest.requireMock("@zenbilling/shared") as any;

describe("CustomerService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation((callback: any) =>
            callback(mockTransaction)
        );
    });

    describe("createCustomer", () => {
        it("should create an individual customer successfully", async () => {
            const userId = "user-123";
            const companyId = "company-123";
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

            const expectedCustomer = {
                customer_id: "customer-123",
                user_id: userId,
                company_id: companyId,
                ...customerData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Mock validation (no existing customer)
            mockTransaction.customer.findFirst.mockResolvedValue(null);

            // Mock customer creation
            mockTransaction.customer.create.mockResolvedValue(expectedCustomer);

            const result = await CustomerService.createCustomer(
                userId,
                companyId,
                customerData
            );

            expect(mockTransaction.customer.findFirst).toHaveBeenCalledWith({
                where: {
                    email: customerData.email,
                    company_id: companyId,
                },
            });
            expect(mockTransaction.customer.create).toHaveBeenCalledWith({
                data: {
                    user_id: userId,
                    company_id: companyId,
                    type: customerData.type,
                    email: customerData.email,
                    phone: customerData.phone,
                    address: customerData.address,
                    city: customerData.city,
                    postal_code: customerData.postal_code,
                    country: "France",
                    individual: {
                        create: customerData.individual,
                    },
                },
                include: {
                    individual: true,
                    business: true,
                },
            });
            expect(result).toEqual(expectedCustomer);
        });

        it("should create a company customer successfully", async () => {
            const userId = "user-123";
            const companyId = "company-123";
            const customerData = {
                type: "company" as const,
                email: "contact@company.com",
                phone: "123456789",
                address: "456 Business St",
                city: "Lyon",
                postal_code: "69001",
                country: "France",
                business: {
                    name: "Test Company",
                    siret: "12345678901234",
                    siren: "123456789",
                    tva_intra: "FR12345678901",
                    tva_applicable: true,
                },
            };

            // Mock validation (no existing customer)
            mockTransaction.customer.findFirst
                .mockResolvedValueOnce(null) // email check
                .mockResolvedValueOnce(null) // siret check
                .mockResolvedValueOnce(null); // siren check

            // Mock customer creation
            mockTransaction.customer.create.mockResolvedValue({
                customer_id: "customer-123",
                user_id: userId,
                company_id: companyId,
                ...customerData,
            });

            await CustomerService.createCustomer(userId, companyId, customerData);

            expect(mockTransaction.customer.findFirst).toHaveBeenCalledTimes(3);
            expect(mockTransaction.customer.create).toHaveBeenCalledWith({
                data: {
                    user_id: userId,
                    company_id: companyId,
                    type: customerData.type,
                    email: customerData.email,
                    phone: customerData.phone,
                    address: customerData.address,
                    city: customerData.city,
                    postal_code: customerData.postal_code,
                    country: "France",
                    business: {
                        create: customerData.business,
                    },
                },
                include: {
                    individual: true,
                    business: true,
                },
            });
        });

        it("should throw error if email already exists", async () => {
            const customerData = {
                type: "individual" as const,
                email: "existing@example.com",
                address: "123 Main St",
                city: "Paris",
                postal_code: "75001",
                individual: { first_name: "Jane", last_name: "Doe" },
            };

            mockTransaction.customer.findFirst.mockResolvedValue({
                customer_id: "existing-customer",
                email: "existing@example.com",
            });

            await expect(
                CustomerService.createCustomer("user-123", "company-123", customerData)
            ).rejects.toThrow("Un client avec cet email existe déjà dans votre entreprise");
        });

        it("should throw error if SIRET already exists", async () => {
            const customerData = {
                type: "company" as const,
                email: "new@company.com",
                address: "456 Business St",
                city: "Lyon",
                postal_code: "69001",
                business: {
                    name: "New Company",
                    siret: "12345678901234",
                    siren: "123456789",
                    tva_applicable: true,
                },
            };

            mockTransaction.customer.findFirst
                .mockResolvedValueOnce(null) // email check passes
                .mockResolvedValueOnce({ // siret check fails
                    customer_id: "existing-customer",
                    business: { siret: "12345678901234" },
                });

            await expect(
                CustomerService.createCustomer("user-123", "company-123", customerData)
            ).rejects.toThrow("Un client avec ce SIRET existe déjà dans votre entreprise");
        });
    });

    describe("getCustomerWithDetails", () => {
        it("should get customer successfully", async () => {
            const customerId = "customer-123";
            const companyId = "company-123";
            const expectedCustomer = {
                customer_id: customerId,
                company_id: companyId,
                type: "individual",
                email: "customer@example.com",
                individual: { first_name: "Jane", last_name: "Doe" },
            };

            prisma.customer.findFirst.mockResolvedValue(expectedCustomer);

            const result = await CustomerService.getCustomerWithDetails(
                customerId,
                companyId
            );

            expect(prisma.customer.findFirst).toHaveBeenCalledWith({
                where: {
                    customer_id: customerId,
                    company_id: companyId,
                },
                include: {
                    individual: true,
                    business: true,
                },
            });
            expect(result).toEqual(expectedCustomer);
        });

        it("should throw error if customer not found", async () => {
            prisma.customer.findFirst.mockResolvedValue(null);

            await expect(
                CustomerService.getCustomerWithDetails("nonexistent", "company-123")
            ).rejects.toThrow("Client non trouvé");
        });
    });

    describe("updateCustomer", () => {
        it("should update customer successfully", async () => {
            const customerId = "customer-123";
            const companyId = "company-123";
            const updateData = {
                email: "updated@example.com",
                phone: "987654321",
                individual: {
                    first_name: "Updated",
                    last_name: "Name",
                },
            };

            const existingCustomer = {
                customer_id: customerId,
                company_id: companyId,
                type: "individual",
                email: "old@example.com",
                individual: { first_name: "Old", last_name: "Name" },
                business: null,
            };

            const updatedCustomer = {
                ...existingCustomer,
                ...updateData,
            };

            mockTransaction.customer.findFirst
                .mockResolvedValueOnce(existingCustomer) // get existing customer
                .mockResolvedValueOnce(null); // email validation check

            mockTransaction.customer.update.mockResolvedValue(updatedCustomer);

            const result = await CustomerService.updateCustomer(
                customerId,
                companyId,
                updateData
            );

            expect(mockTransaction.customer.findFirst).toHaveBeenCalledWith({
                where: {
                    customer_id: customerId,
                    company_id: companyId,
                },
                include: {
                    business: true,
                    individual: true,
                },
            });
            expect(mockTransaction.customer.update).toHaveBeenCalledWith({
                where: { customer_id: customerId },
                data: {
                    email: updateData.email,
                    phone: updateData.phone,
                    address: undefined,
                    city: undefined,
                    postal_code: undefined,
                    country: undefined,
                    individual: {
                        update: updateData.individual,
                    },
                },
                include: {
                    individual: true,
                    business: true,
                },
            });
            expect(result).toEqual(updatedCustomer);
        });

        it("should throw error if customer not found", async () => {
            mockTransaction.customer.findFirst.mockResolvedValue(null);

            await expect(
                CustomerService.updateCustomer("nonexistent", "company-123", {})
            ).rejects.toThrow("Client non trouvé");
        });
    });

    describe("deleteCustomer", () => {
        it("should delete customer successfully", async () => {
            const customerId = "customer-123";
            const companyId = "company-123";

            mockTransaction.customer.findFirst.mockResolvedValue({
                customer_id: customerId,
                company_id: companyId,
            });
            mockTransaction.customer.delete.mockResolvedValue({});

            await CustomerService.deleteCustomer(customerId, companyId);

            expect(mockTransaction.customer.findFirst).toHaveBeenCalledWith({
                where: {
                    customer_id: customerId,
                    company_id: companyId,
                },
            });
            expect(mockTransaction.customer.delete).toHaveBeenCalledWith({
                where: { customer_id: customerId },
            });
        });

        it("should throw error if customer not found", async () => {
            mockTransaction.customer.findFirst.mockResolvedValue(null);

            await expect(
                CustomerService.deleteCustomer("nonexistent", "company-123")
            ).rejects.toThrow("Client non trouvé");
        });
    });

    describe("getCompanyCustomers", () => {
        it("should get company customers with default parameters", async () => {
            const companyId = "company-123";
            const customers = [
                { customer_id: "customer-1", email: "customer1@example.com" },
                { customer_id: "customer-2", email: "customer2@example.com" },
            ];

            prisma.customer.findMany.mockResolvedValue(customers);
            prisma.customer.count.mockResolvedValue(2);

            const result = await CustomerService.getCompanyCustomers(companyId);

            expect(prisma.customer.findMany).toHaveBeenCalledWith({
                where: { company_id: companyId },
                include: {
                    individual: true,
                    business: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 10,
                skip: 0,
            });
            expect(prisma.customer.count).toHaveBeenCalledWith({
                where: { company_id: companyId },
            });
            expect(result).toEqual({
                customers,
                total: 2,
                totalPages: 1,
            });
        });

        it("should filter customers by type and search", async () => {
            const companyId = "company-123";
            const queryParams = {
                page: 2,
                limit: 5,
                search: "jane",
                type: "individual" as const,
                sortBy: "email" as const,
                sortOrder: "ASC" as const,
            };

            prisma.customer.findMany.mockResolvedValue([]);
            prisma.customer.count.mockResolvedValue(0);

            await CustomerService.getCompanyCustomers(companyId, queryParams);

            expect(prisma.customer.findMany).toHaveBeenCalledWith({
                where: {
                    company_id: companyId,
                    type: "individual",
                    OR: expect.arrayContaining([
                        { email: { contains: "jane", mode: "insensitive" } },
                        { phone: { contains: "jane", mode: "insensitive" } },
                        { address: { contains: "jane", mode: "insensitive" } },
                        { city: { contains: "jane", mode: "insensitive" } },
                        { postal_code: { contains: "jane", mode: "insensitive" } },
                        {
                            individual: {
                                OR: [
                                    { first_name: { contains: "jane", mode: "insensitive" } },
                                    { last_name: { contains: "jane", mode: "insensitive" } },
                                ],
                            },
                        },
                    ]),
                },
                include: {
                    individual: true,
                },
                orderBy: {
                    email: "asc",
                },
                take: 5,
                skip: 5,
            });
        });

        it("should handle errors gracefully", async () => {
            const error = new Error("Database error");
            prisma.customer.findMany.mockRejectedValue(error);

            await expect(
                CustomerService.getCompanyCustomers("company-123")
            ).rejects.toThrow("Erreur lors de la récupération des clients");
        });
    });
});