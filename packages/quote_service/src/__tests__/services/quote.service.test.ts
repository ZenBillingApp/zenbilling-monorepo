import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { QuoteService } from "../../services/quote.service";
import { CustomError } from "@zenbilling/shared";

// Mock axios for external service calls
jest.mock("axios", () => ({
    post: jest.fn(),
}));

// Mock the shared package
const mockPrisma = {
    quote: {
        create: jest.fn() as any,
        findUnique: jest.fn() as any,
        findMany: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        count: jest.fn() as any,
        updateMany: jest.fn() as any,
    },
    product: {
        findMany: jest.fn() as any,
        create: jest.fn() as any,
    },
    $transaction: jest.fn() as any,
};

const mockTransaction = {
    quote: {
        create: jest.fn() as any,
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        updateMany: jest.fn() as any,
    },
    product: {
        findMany: jest.fn() as any,
        create: jest.fn() as any,
    },
};

jest.mock("@zenbilling/shared", () => ({
    prisma: {
        quote: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
        },
        product: {
            findMany: jest.fn(),
            create: jest.fn(),
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
    Decimal: class MockDecimal {
        private value: number;
        constructor(value: number | string) {
            this.value = typeof value === "string" ? parseFloat(value) : value;
        }
        plus(other: MockDecimal): MockDecimal {
            return new MockDecimal(this.value + other.value);
        }
        times(other: MockDecimal): MockDecimal {
            return new MockDecimal(this.value * other.value);
        }
        div(other: MockDecimal): MockDecimal {
            return new MockDecimal(this.value / other.value);
        }
        toFixed(decimals: number): string {
            return this.value.toFixed(decimals);
        }
    },
    vatRateToNumber: jest.fn((rate: string) => {
        const rates: { [key: string]: number } = {
            TVA_0: 0,
            TVA_5_5: 5.5,
            TVA_10: 10,
            TVA_20: 20,
        };
        return rates[rate] || 20;
    }),
}));

// Get mocked modules
const { prisma } = jest.requireMock("@zenbilling/shared") as any;
const mockAxios = jest.requireMock("axios") as any;

describe("QuoteService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.$transaction.mockImplementation((callback: any) =>
            callback(mockTransaction)
        );
    });

    describe("createQuote", () => {
        it("should create a quote successfully", async () => {
            const userId = "user-123";
            const companyId = "company-123";
            const quoteData = {
                customer_id: "customer-123",
                quote_date: new Date("2024-01-01"),
                validity_date: new Date("2024-02-01"),
                items: [
                    {
                        product_id: "product-123",
                        quantity: 2 as any,
                        unit_price_excluding_tax: 100 as any,
                        vat_rate: "TVA_20" as const,
                    },
                ],
                conditions: "Conditions de vente",
                notes: "Notes",
            };

            const mockProduct = {
                product_id: "product-123",
                price_excluding_tax: 100,
                vat_rate: "TVA_20",
                unit: "unite",
            };

            const expectedQuote = {
                quote_id: "quote-123",
                quote_number: "DEVIS-comp12-202401-001",
                user_id: userId,
                company_id: companyId,
                ...quoteData,
                amount_excluding_tax: "200.00",
                tax: "40.00",
                amount_including_tax: "240.00",
                status: "draft",
                items: [],
                customer: {},
                company: {},
            };

            // Mock product validation
            mockTransaction.product.findMany.mockResolvedValue([mockProduct]);

            // Mock quote creation
            mockTransaction.quote.create.mockResolvedValue({
                quote_id: "quote-123",
                quote_number: "DEVIS-comp12-202401-001",
            });

            // Mock quote update with totals
            mockTransaction.quote.update.mockResolvedValue(expectedQuote);

            const result = await QuoteService.createQuote(
                userId,
                companyId,
                quoteData as any
            );

            expect(mockTransaction.product.findMany).toHaveBeenCalledWith({
                where: {
                    product_id: {
                        in: ["product-123"],
                    },
                    company_id: companyId,
                },
            });

            expect(mockTransaction.quote.create).toHaveBeenCalled();
            expect(mockTransaction.quote.update).toHaveBeenCalled();
            expect(result).toEqual(expectedQuote);
        });

        it("should throw error if product doesn't exist", async () => {
            const userId = "user-123";
            const companyId = "company-123";
            const quoteData = {
                customer_id: "customer-123",
                quote_date: new Date("2024-01-01"),
                validity_date: new Date("2024-02-01"),
                items: [
                    {
                        product_id: "nonexistent-product",
                        quantity: 1 as any,
                        unit_price_excluding_tax: 100 as any,
                        vat_rate: "TVA_20" as const,
                    },
                ],
            };

            // Mock empty product result
            mockTransaction.product.findMany.mockResolvedValue([]);

            await expect(
                QuoteService.createQuote(userId, companyId, quoteData as any)
            ).rejects.toThrow(
                "Certains produits n'existent pas ou n'appartiennent pas à votre société"
            );
        });

        it("should create quote without products (custom items)", async () => {
            const userId = "user-123";
            const companyId = "company-123";
            const quoteData = {
                customer_id: "customer-123",
                quote_date: new Date("2024-01-01"),
                validity_date: new Date("2024-02-01"),
                items: [
                    {
                        name: "Service personnalisé",
                        description: "Description du service",
                        quantity: 1 as any,
                        unit_price_excluding_tax: 500 as any,
                        vat_rate: "TVA_20" as const,
                        unit: "heure",
                    },
                ],
            };

            const expectedQuote = {
                quote_id: "quote-123",
                items: [],
                customer: {},
                company: {},
            };

            // No products to validate
            mockTransaction.product.findMany.mockResolvedValue([]);
            mockTransaction.quote.create.mockResolvedValue({
                quote_id: "quote-123",
            });
            mockTransaction.quote.update.mockResolvedValue(expectedQuote);

            const result = await QuoteService.createQuote(
                userId,
                companyId,
                quoteData as any
            );

            expect(result).toEqual(expectedQuote);
        });
    });

    describe("updateQuote", () => {
        it("should update quote successfully", async () => {
            const quoteId = "quote-123";
            const companyId = "company-123";
            const updateData = {
                status: "sent" as const,
                notes: "Updated notes",
            };

            const existingQuote = {
                quote_id: quoteId,
                company_id: companyId,
                status: "draft",
            };

            const updatedQuote = {
                ...existingQuote,
                ...updateData,
            };

            mockTransaction.quote.findUnique.mockResolvedValue(existingQuote);
            mockTransaction.quote.update.mockResolvedValue(updatedQuote);

            const result = await QuoteService.updateQuote(
                quoteId,
                companyId,
                updateData
            );

            expect(mockTransaction.quote.findUnique).toHaveBeenCalledWith({
                where: {
                    quote_id: quoteId,
                    company_id: companyId,
                },
            });
            expect(mockTransaction.quote.update).toHaveBeenCalledWith({
                where: { quote_id: quoteId },
                data: updateData,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    customer: {
                        include: {
                            business: true,
                            individual: true,
                        },
                    },
                    company: true,
                },
            });
            expect(result).toEqual(updatedQuote);
        });

        it("should throw error if quote not found", async () => {
            mockTransaction.quote.findUnique.mockResolvedValue(null);

            await expect(
                QuoteService.updateQuote("nonexistent", "company-123", {})
            ).rejects.toThrow("Devis non trouvé");
        });

        it("should throw error if trying to update accepted quote", async () => {
            const existingQuote = {
                quote_id: "quote-123",
                status: "accepted",
            };

            mockTransaction.quote.findUnique.mockResolvedValue(existingQuote);

            await expect(
                QuoteService.updateQuote("quote-123", "company-123", {})
            ).rejects.toThrow("Impossible de modifier un devis accepté");
        });

        it("should throw error if trying to update rejected quote", async () => {
            const existingQuote = {
                quote_id: "quote-123",
                status: "rejected",
            };

            mockTransaction.quote.findUnique.mockResolvedValue(existingQuote);

            await expect(
                QuoteService.updateQuote("quote-123", "company-123", {})
            ).rejects.toThrow("Impossible de modifier un devis rejeté");
        });

        it("should throw error if trying to update expired quote", async () => {
            const existingQuote = {
                quote_id: "quote-123",
                status: "expired",
            };

            mockTransaction.quote.findUnique.mockResolvedValue(existingQuote);

            await expect(
                QuoteService.updateQuote("quote-123", "company-123", {})
            ).rejects.toThrow("Impossible de modifier un devis expiré");
        });
    });

    describe("getQuoteWithDetails", () => {
        it("should get quote successfully", async () => {
            const quoteId = "quote-123";
            const companyId = "company-123";
            const expectedQuote = {
                quote_id: quoteId,
                company_id: companyId,
                quote_number: "DEVIS-001",
                items: [],
                customer: {},
                company: {},
                user: {},
            };

            prisma.quote.findUnique.mockResolvedValue(expectedQuote);

            const result = await QuoteService.getQuoteWithDetails(
                quoteId,
                companyId
            );

            expect(prisma.quote.findUnique).toHaveBeenCalledWith({
                where: {
                    quote_id: quoteId,
                    company_id: companyId,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    customer: {
                        include: {
                            business: true,
                            individual: true,
                        },
                    },
                    company: true,
                    user: true,
                },
            });
            expect(result).toEqual(expectedQuote);
        });

        it("should throw error if quote not found", async () => {
            prisma.quote.findUnique.mockResolvedValue(null);

            await expect(
                QuoteService.getQuoteWithDetails("nonexistent", "company-123")
            ).rejects.toThrow("Devis non trouvé");
        });
    });

    describe("deleteQuote", () => {
        it("should delete quote successfully", async () => {
            const quoteId = "quote-123";
            const companyId = "company-123";

            const existingQuote = {
                quote_id: quoteId,
                status: "draft",
            };

            mockTransaction.quote.findUnique.mockResolvedValue(existingQuote);
            mockTransaction.quote.delete.mockResolvedValue({});

            await QuoteService.deleteQuote(quoteId, companyId);

            expect(mockTransaction.quote.findUnique).toHaveBeenCalledWith({
                where: {
                    quote_id: quoteId,
                    company_id: companyId,
                },
            });
            expect(mockTransaction.quote.delete).toHaveBeenCalledWith({
                where: { quote_id: quoteId },
            });
        });

        it("should throw error if quote not found", async () => {
            mockTransaction.quote.findUnique.mockResolvedValue(null);

            await expect(
                QuoteService.deleteQuote("nonexistent", "company-123")
            ).rejects.toThrow("Devis non trouvé");
        });

        it("should throw error if trying to delete accepted quote", async () => {
            const existingQuote = {
                quote_id: "quote-123",
                status: "accepted",
            };

            mockTransaction.quote.findUnique.mockResolvedValue(existingQuote);

            await expect(
                QuoteService.deleteQuote("quote-123", "company-123")
            ).rejects.toThrow("Impossible de supprimer un devis accepté");
        });
    });

    describe("getCompanyQuotes", () => {
        it("should get company quotes with default parameters", async () => {
            const companyId = "company-123";
            const quotes = [
                { quote_id: "quote-1", quote_number: "DEVIS-001" },
                { quote_id: "quote-2", quote_number: "DEVIS-002" },
            ];

            prisma.$transaction.mockResolvedValueOnce([quotes, 2]);
            prisma.$transaction.mockResolvedValueOnce([1, 1, 0, 0, 0, 2]);

            const result = await QuoteService.getOrganizationQuotes(companyId);

            expect(result).toEqual({
                quotes,
                total: 2,
                totalPages: 1,
                statusCounts: {
                    draft: 1,
                    sent: 1,
                    accepted: 0,
                    rejected: 0,
                    expired: 0,
                    total: 2,
                },
            });
        });

        it("should filter quotes by status and search", async () => {
            const companyId = "company-123";
            const queryParams = {
                page: 1,
                limit: 5,
                search: "client",
                status: "sent" as const,
                sortBy: "quote_number" as const,
                sortOrder: "ASC" as const,
            };

            prisma.$transaction.mockResolvedValueOnce([[], 0]);
            prisma.$transaction.mockResolvedValueOnce([0, 0, 0, 0, 0, 0]);

            await QuoteService.getOrganizationQuotes(companyId, queryParams);

            // Verify the query was called with correct parameters
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it("should filter quotes by date range and amount", async () => {
            const companyId = "company-123";
            const queryParams = {
                start_date: "2024-01-01",
                end_date: "2024-12-31",
                min_amount: 100,
                max_amount: 1000,
                customer_id: "customer-123",
            };

            prisma.$transaction.mockResolvedValueOnce([[], 0]);
            prisma.$transaction.mockResolvedValueOnce([0, 0, 0, 0, 0, 0]);

            const result = await QuoteService.getOrganizationQuotes(
                companyId,
                queryParams
            );

            expect(result.quotes).toEqual([]);
            expect(result.total).toBe(0);
        });
    });

    describe("sendQuoteByEmail", () => {
        beforeEach(() => {
            process.env.PDF_SERVICE_URL = "http://localhost:3010";
            process.env.EMAIL_SERVICE_URL = "http://localhost:3007";
        });

        it("should send quote by email successfully", async () => {
            const quoteId = "quote-123";
            const companyId = "company-123";
            const user = {
                id: "user-123",
                first_name: "John",
                last_name: "Doe",
            };

            const quote = {
                quote_id: quoteId,
                quote_number: "DEVIS-001",
                amount_including_tax: "240.00",
                validity_date: "2024-02-01",
                status: "draft",
                customer: {
                    email: "customer@example.com",
                    individual: {
                        first_name: "Jane",
                        last_name: "Smith",
                    },
                },
                company: {
                    name: "Test Company",
                },
            };

            const pdfBuffer = Buffer.from("PDF content");

            prisma.quote.findUnique.mockResolvedValue(quote);
            mockAxios.post
                .mockResolvedValueOnce({ data: pdfBuffer }) // PDF service
                .mockResolvedValueOnce({}); // Email service

            prisma.quote.update.mockResolvedValue({});

            await QuoteService.sendQuoteByEmail(quoteId, companyId, user);

            expect(mockAxios.post).toHaveBeenCalledTimes(2);
            expect(mockAxios.post).toHaveBeenNthCalledWith(
                1,
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
            expect(prisma.quote.update).toHaveBeenCalledWith({
                where: { quote_id: quoteId },
                data: { status: "sent" },
            });
        });

        it("should throw error if customer has no email", async () => {
            const quote = {
                quote_id: "quote-123",
                customer: {
                    email: null, // No email
                },
            };

            prisma.quote.findUnique.mockResolvedValue(quote);

            await expect(
                QuoteService.sendQuoteByEmail("quote-123", "company-123", {})
            ).rejects.toThrow("Le client n'a pas d'adresse email");
        });

        it("should throw error if PDF generation fails", async () => {
            const quote = {
                quote_id: "quote-123",
                customer: {
                    email: "customer@example.com",
                },
                company: {},
            };

            prisma.quote.findUnique.mockResolvedValue(quote);
            mockAxios.post.mockResolvedValue({ data: null }); // PDF service returns null

            await expect(
                QuoteService.sendQuoteByEmail("quote-123", "company-123", {})
            ).rejects.toThrow("Erreur lors de la génération du PDF");
        });
    });

    describe("updateExpiredQuotes", () => {
        it("should update expired quotes successfully", async () => {
            mockTransaction.quote.updateMany.mockResolvedValue({ count: 5 });

            await QuoteService.updateExpiredQuotes();

            expect(mockTransaction.quote.updateMany).toHaveBeenCalledWith({
                data: { status: "expired" },
                where: {
                    validity_date: {
                        lt: expect.any(Date),
                    },
                    status: {
                        notIn: ["expired", "accepted", "rejected"],
                    },
                },
            });
        });

        it("should handle errors gracefully", async () => {
            const error = new Error("Database error");
            mockTransaction.quote.updateMany.mockRejectedValue(error);

            await expect(QuoteService.updateExpiredQuotes()).rejects.toThrow(
                "Erreur lors de la mise à jour des devis expirés"
            );
        });
    });

    describe("getCustomerQuotes", () => {
        it("should get customer quotes successfully", async () => {
            const customerId = "customer-123";
            const companyId = "company-123";
            const quotes = [{ quote_id: "quote-1", customer_id: customerId }];

            prisma.quote.findMany.mockResolvedValue(quotes);
            prisma.quote.count.mockResolvedValue(1);

            const result = await QuoteService.getCustomerQuotes(
                customerId,
                companyId
            );

            expect(prisma.quote.findMany).toHaveBeenCalledWith({
                where: {
                    customer_id: customerId,
                    company_id: companyId,
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
                orderBy: {
                    quote_date: "desc",
                },
                take: 10,
                skip: 0,
            });
            expect(result).toEqual({
                quotes,
                total: 1,
                totalPages: 1,
            });
        });

        it("should filter customer quotes by parameters", async () => {
            const customerId = "customer-123";
            const companyId = "company-123";
            const queryParams = {
                page: 2,
                limit: 5,
                status: "sent" as const,
                search: "test",
                start_date: "2024-01-01",
                end_date: "2024-12-31",
                min_amount: 100,
                max_amount: 500,
                sortBy: "amount_including_tax" as const,
                sortOrder: "ASC" as const,
            };

            prisma.quote.findMany.mockResolvedValue([]);
            prisma.quote.count.mockResolvedValue(0);

            await QuoteService.getCustomerQuotes(
                customerId,
                companyId,
                queryParams
            );

            expect(prisma.quote.findMany).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    customer_id: customerId,
                    company_id: companyId,
                    status: "sent",
                }),
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
                orderBy: {
                    amount_including_tax: "asc",
                },
                take: 5,
                skip: 5,
            });
        });

        it("should handle errors gracefully", async () => {
            const error = new Error("Database error");
            prisma.quote.findMany.mockRejectedValue(error);

            await expect(
                QuoteService.getCustomerQuotes("customer-123", "company-123")
            ).rejects.toThrow(
                "Erreur lors de la récupération des devis du client"
            );
        });
    });
});
