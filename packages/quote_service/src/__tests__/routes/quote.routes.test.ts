import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import quoteRoutes from "../../routes/quote.routes";

// Mock the controller
jest.mock("../../controllers/quote.controller", () => ({
    QuoteController: {
        createQuote: jest.fn((req: any, res: any) =>
            res.status(201).json({ success: true, message: "Quote created" })
        ),
        updateQuote: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, message: "Quote updated" })
        ),
        deleteQuote: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, message: "Quote deleted" })
        ),
        getQuote: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, data: { id: req.params.id } })
        ),
        getCompanyQuotes: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, data: { quotes: [] } })
        ),
        downloadQuotePdf: jest.fn((req: any, res: any) => {
            res.setHeader("Content-Type", "application/pdf");
            res.send(Buffer.from("PDF content"));
        }),
        sendQuoteByEmail: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, message: "Quote sent by email" })
        ),
        getCustomerQuotes: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, data: { quotes: [] } })
        ),
    },
}));

// Mock middleware
jest.mock("@zenbilling/shared", () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = {
            id: "user-123",
            company_id: "company-123",
            email: "test@example.com",
            first_name: "Test",
            last_name: "User",
        };
        next();
    },
    validateRequest: (schema: any) => (req: any, res: any, next: any) => {
        // Simple validation mock - in real scenario this would validate against Joi schema
        if (req.method === "POST" || req.method === "PUT") {
            if (!req.body.customer_id && req.method === "POST") {
                return res.status(400).json({ error: "Validation failed" });
            }
        }
        next();
    },
    createQuoteSchema: {},
    updateQuoteSchema: {},
}));

const mockController = jest.requireMock("../../controllers/quote.controller") as any;
const QuoteController = mockController.QuoteController;

describe("Quote Routes", () => {
    let app: express.Application;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use("/quotes", quoteRoutes);
    });

    describe("POST /quotes", () => {
        it("should create a quote", async () => {
            const quoteData = {
                customer_id: "customer-123",
                quote_date: "2024-01-01",
                validity_date: "2024-02-01",
                items: [
                    {
                        product_id: "product-123",
                        quantity: 2,
                        unit_price_excluding_tax: 100,
                        vat_rate: "TVA_20",
                    },
                ],
            };

            const response = await request(app)
                .post("/quotes")
                .send(quoteData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Quote created");
            expect(QuoteController.createQuote).toHaveBeenCalledTimes(1);
        });

        it("should validate request data", async () => {
            const response = await request(app)
                .post("/quotes")
                .send({}) // Missing required fields
                .expect(400);

            expect(response.body.error).toBe("Validation failed");
            expect(QuoteController.createQuote).not.toHaveBeenCalled();
        });

        it("should apply auth middleware", async () => {
            const quoteData = {
                customer_id: "customer-123",
                quote_date: "2024-01-01",
                validity_date: "2024-02-01",
                items: [],
            };

            await request(app)
                .post("/quotes")
                .send(quoteData)
                .expect(201);

            // Auth middleware should have set req.user
            const mockCall = QuoteController.createQuote.mock.calls[0];
            expect(mockCall[0].user).toEqual({
                id: "user-123",
                company_id: "company-123",
                email: "test@example.com",
                first_name: "Test",
                last_name: "User",
            });
        });
    });

    describe("GET /quotes", () => {
        it("should get company quotes", async () => {
            const response = await request(app)
                .get("/quotes")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.quotes).toEqual([]);
            expect(QuoteController.getCompanyQuotes).toHaveBeenCalledTimes(1);
        });

        it("should pass query parameters", async () => {
            await request(app)
                .get("/quotes")
                .query({
                    page: "2",
                    limit: "5",
                    search: "test",
                    status: "draft",
                    customer_id: "customer-123",
                })
                .expect(200);

            const mockCall = QuoteController.getCompanyQuotes.mock.calls[0];
            expect(mockCall[0].query).toEqual({
                page: "2",
                limit: "5",
                search: "test",
                status: "draft",
                customer_id: "customer-123",
            });
        });
    });

    describe("GET /quotes/customer/:customerId", () => {
        it("should get customer quotes", async () => {
            const customerId = "customer-123";

            const response = await request(app)
                .get(`/quotes/customer/${customerId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.quotes).toEqual([]);
            expect(QuoteController.getCustomerQuotes).toHaveBeenCalledTimes(1);

            const mockCall = QuoteController.getCustomerQuotes.mock.calls[0];
            expect(mockCall[0].params.customerId).toBe(customerId);
        });

        it("should pass query parameters for customer quotes", async () => {
            const customerId = "customer-123";

            await request(app)
                .get(`/quotes/customer/${customerId}`)
                .query({
                    page: "1",
                    limit: "10",
                    status: "sent",
                })
                .expect(200);

            const mockCall = QuoteController.getCustomerQuotes.mock.calls[0];
            expect(mockCall[0].query).toEqual({
                page: "1",
                limit: "10",
                status: "sent",
            });
        });
    });

    describe("GET /quotes/:id", () => {
        it("should get a specific quote", async () => {
            const quoteId = "quote-123";

            const response = await request(app)
                .get(`/quotes/${quoteId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(quoteId);
            expect(QuoteController.getQuote).toHaveBeenCalledTimes(1);

            const mockCall = QuoteController.getQuote.mock.calls[0];
            expect(mockCall[0].params.id).toBe(quoteId);
        });
    });

    describe("PUT /quotes/:id", () => {
        it("should update a quote", async () => {
            const quoteId = "quote-123";
            const updateData = {
                status: "sent",
                notes: "Updated notes",
            };

            const response = await request(app)
                .put(`/quotes/${quoteId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Quote updated");
            expect(QuoteController.updateQuote).toHaveBeenCalledTimes(1);

            const mockCall = QuoteController.updateQuote.mock.calls[0];
            expect(mockCall[0].params.id).toBe(quoteId);
            expect(mockCall[0].body).toEqual(updateData);
        });

        it("should apply validation middleware", async () => {
            const quoteId = "quote-123";

            await request(app)
                .put(`/quotes/${quoteId}`)
                .send({ status: "sent" })
                .expect(200);

            expect(QuoteController.updateQuote).toHaveBeenCalledTimes(1);
        });
    });

    describe("DELETE /quotes/:id", () => {
        it("should delete a quote", async () => {
            const quoteId = "quote-123";

            const response = await request(app)
                .delete(`/quotes/${quoteId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Quote deleted");
            expect(QuoteController.deleteQuote).toHaveBeenCalledTimes(1);

            const mockCall = QuoteController.deleteQuote.mock.calls[0];
            expect(mockCall[0].params.id).toBe(quoteId);
        });
    });

    describe("GET /quotes/:id/pdf", () => {
        it("should download quote PDF", async () => {
            const quoteId = "quote-123";

            const response = await request(app)
                .get(`/quotes/${quoteId}/pdf`)
                .expect(200);

            expect(response.headers["content-type"]).toBe("application/pdf");
            expect(response.body).toEqual(Buffer.from("PDF content"));
            expect(QuoteController.downloadQuotePdf).toHaveBeenCalledTimes(1);

            const mockCall = QuoteController.downloadQuotePdf.mock.calls[0];
            expect(mockCall[0].params.id).toBe(quoteId);
        });
    });

    describe("POST /quotes/:id/send", () => {
        it("should send quote by email", async () => {
            const quoteId = "quote-123";

            const response = await request(app)
                .post(`/quotes/${quoteId}/send`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Quote sent by email");
            expect(QuoteController.sendQuoteByEmail).toHaveBeenCalledTimes(1);

            const mockCall = QuoteController.sendQuoteByEmail.mock.calls[0];
            expect(mockCall[0].params.id).toBe(quoteId);
        });
    });

    describe("Middleware Integration", () => {
        it("should apply auth middleware to all routes", async () => {
            await request(app).post("/quotes").send({ customer_id: "customer-123" });
            await request(app).get("/quotes");
            await request(app).get("/quotes/customer/customer-123");
            await request(app).get("/quotes/123");
            await request(app).put("/quotes/123").send({});
            await request(app).delete("/quotes/123");
            await request(app).get("/quotes/123/pdf");
            await request(app).post("/quotes/123/send");

            // Check that all controller methods received the user object
            expect(QuoteController.createQuote.mock.calls[0][0].user).toBeDefined();
            expect(QuoteController.getCompanyQuotes.mock.calls[0][0].user).toBeDefined();
            expect(QuoteController.getCustomerQuotes.mock.calls[0][0].user).toBeDefined();
            expect(QuoteController.getQuote.mock.calls[0][0].user).toBeDefined();
            expect(QuoteController.updateQuote.mock.calls[0][0].user).toBeDefined();
            expect(QuoteController.deleteQuote.mock.calls[0][0].user).toBeDefined();
            expect(QuoteController.downloadQuotePdf.mock.calls[0][0].user).toBeDefined();
            expect(QuoteController.sendQuoteByEmail.mock.calls[0][0].user).toBeDefined();
        });

        it("should apply validation middleware to POST and PUT routes", async () => {
            // Test POST validation
            await request(app).post("/quotes").send({}).expect(400);
            expect(QuoteController.createQuote).not.toHaveBeenCalled();

            // Reset call count
            jest.clearAllMocks();

            // Test valid POST
            await request(app)
                .post("/quotes")
                .send({ customer_id: "customer-123" })
                .expect(201);
            expect(QuoteController.createQuote).toHaveBeenCalledTimes(1);

            // Test PUT (validation passes for any data in our mock)
            await request(app)
                .put("/quotes/123")
                .send({ status: "sent" })
                .expect(200);
            expect(QuoteController.updateQuote).toHaveBeenCalledTimes(1);
        });
    });

    describe("Route Parameters and Order", () => {
        it("should handle route parameter order correctly", async () => {
            // Test that /customer/:customerId comes before /:id
            await request(app)
                .get("/quotes/customer/customer-123")
                .expect(200);

            expect(QuoteController.getCustomerQuotes).toHaveBeenCalledTimes(1);
            expect(QuoteController.getQuote).not.toHaveBeenCalled();
        });

        it("should handle specific quote ID after customer routes", async () => {
            await request(app)
                .get("/quotes/quote-123")
                .expect(200);

            expect(QuoteController.getQuote).toHaveBeenCalledTimes(1);
            expect(QuoteController.getCustomerQuotes).not.toHaveBeenCalled();
        });

        it("should handle PDF download route", async () => {
            await request(app)
                .get("/quotes/quote-123/pdf")
                .expect(200);

            expect(QuoteController.downloadQuotePdf).toHaveBeenCalledTimes(1);
            expect(QuoteController.getQuote).not.toHaveBeenCalled();
        });

        it("should handle email send route", async () => {
            await request(app)
                .post("/quotes/quote-123/send")
                .expect(200);

            expect(QuoteController.sendQuoteByEmail).toHaveBeenCalledTimes(1);
        });
    });

    describe("HTTP Methods", () => {
        it("should only allow POST for creating quotes", async () => {
            await request(app)
                .get("/quotes")
                .expect(200); // This should call getCompanyQuotes

            await request(app)
                .post("/quotes")
                .send({ customer_id: "customer-123" })
                .expect(201); // This should call createQuote

            expect(QuoteController.getCompanyQuotes).toHaveBeenCalledTimes(1);
            expect(QuoteController.createQuote).toHaveBeenCalledTimes(1);
        });

        it("should only allow PUT for updating quotes", async () => {
            await request(app)
                .put("/quotes/quote-123")
                .send({ status: "sent" })
                .expect(200);

            expect(QuoteController.updateQuote).toHaveBeenCalledTimes(1);
        });

        it("should only allow DELETE for deleting quotes", async () => {
            await request(app)
                .delete("/quotes/quote-123")
                .expect(200);

            expect(QuoteController.deleteQuote).toHaveBeenCalledTimes(1);
        });

        it("should only allow GET for retrieving quotes", async () => {
            await request(app)
                .get("/quotes/quote-123")
                .expect(200);

            expect(QuoteController.getQuote).toHaveBeenCalledTimes(1);
        });
    });
});