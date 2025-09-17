import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import customerRoutes from "../../routes/customer.routes";

// Mock the controller
jest.mock("../../controllers/customer.controller", () => ({
    CustomerController: {
        createCustomer: jest.fn((req: any, res: any) =>
            res.status(201).json({ success: true, message: "Customer created" })
        ),
        getCustomer: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, data: { id: req.params.id } })
        ),
        updateCustomer: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, message: "Customer updated" })
        ),
        deleteCustomer: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, message: "Customer deleted" })
        ),
        getCompanyCustomers: jest.fn((req: any, res: any) =>
            res.status(200).json({ success: true, data: { customers: [] } })
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
            if (!req.body.type && req.method === "POST") {
                return res.status(400).json({ error: "Validation failed" });
            }
        }
        next();
    },
    createCustomerSchema: {},
    updateCustomerSchema: {},
}));

const mockController = jest.requireMock("../../controllers/customer.controller") as any;
const CustomerController = mockController.CustomerController;

describe("Customer Routes", () => {
    let app: express.Application;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use("/customers", customerRoutes);
    });

    describe("POST /customers", () => {
        it("should create a customer", async () => {
            const customerData = {
                type: "individual",
                email: "test@example.com",
                individual: {
                    first_name: "John",
                    last_name: "Doe",
                },
            };

            const response = await request(app)
                .post("/customers")
                .send(customerData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Customer created");
            expect(CustomerController.createCustomer).toHaveBeenCalledTimes(1);
        });

        it("should validate request data", async () => {
            const response = await request(app)
                .post("/customers")
                .send({}) // Missing required fields
                .expect(400);

            expect(response.body.error).toBe("Validation failed");
            expect(CustomerController.createCustomer).not.toHaveBeenCalled();
        });

        it("should apply auth middleware", async () => {
            const customerData = {
                type: "individual",
                email: "test@example.com",
                individual: {
                    first_name: "John",
                    last_name: "Doe",
                },
            };

            await request(app)
                .post("/customers")
                .send(customerData)
                .expect(201);

            // Auth middleware should have set req.user
            const mockCall = CustomerController.createCustomer.mock.calls[0];
            expect(mockCall[0].user).toEqual({
                id: "user-123",
                company_id: "company-123",
                email: "test@example.com",
                first_name: "Test",
                last_name: "User",
            });
        });
    });

    describe("GET /customers", () => {
        it("should get company customers", async () => {
            const response = await request(app)
                .get("/customers")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.customers).toEqual([]);
            expect(CustomerController.getCompanyCustomers).toHaveBeenCalledTimes(1);
        });

        it("should pass query parameters", async () => {
            await request(app)
                .get("/customers")
                .query({
                    page: "2",
                    limit: "5",
                    search: "john",
                    type: "individual",
                })
                .expect(200);

            const mockCall = CustomerController.getCompanyCustomers.mock.calls[0];
            expect(mockCall[0].query).toEqual({
                page: "2",
                limit: "5",
                search: "john",
                type: "individual",
            });
        });
    });

    describe("GET /customers/:id", () => {
        it("should get a specific customer", async () => {
            const customerId = "customer-123";

            const response = await request(app)
                .get(`/customers/${customerId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(customerId);
            expect(CustomerController.getCustomer).toHaveBeenCalledTimes(1);

            const mockCall = CustomerController.getCustomer.mock.calls[0];
            expect(mockCall[0].params.id).toBe(customerId);
        });
    });

    describe("PUT /customers/:id", () => {
        it("should update a customer", async () => {
            const customerId = "customer-123";
            const updateData = {
                email: "updated@example.com",
                phone: "123456789",
            };

            const response = await request(app)
                .put(`/customers/${customerId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Customer updated");
            expect(CustomerController.updateCustomer).toHaveBeenCalledTimes(1);

            const mockCall = CustomerController.updateCustomer.mock.calls[0];
            expect(mockCall[0].params.id).toBe(customerId);
            expect(mockCall[0].body).toEqual(updateData);
        });

        it("should apply validation middleware", async () => {
            const customerId = "customer-123";

            await request(app)
                .put(`/customers/${customerId}`)
                .send({ email: "updated@example.com" })
                .expect(200);

            expect(CustomerController.updateCustomer).toHaveBeenCalledTimes(1);
        });
    });

    describe("DELETE /customers/:id", () => {
        it("should delete a customer", async () => {
            const customerId = "customer-123";

            const response = await request(app)
                .delete(`/customers/${customerId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Customer deleted");
            expect(CustomerController.deleteCustomer).toHaveBeenCalledTimes(1);

            const mockCall = CustomerController.deleteCustomer.mock.calls[0];
            expect(mockCall[0].params.id).toBe(customerId);
        });
    });

    describe("Middleware Integration", () => {
        it("should apply auth middleware to all routes", async () => {
            await request(app).post("/customers").send({ type: "individual" });
            await request(app).get("/customers");
            await request(app).get("/customers/123");
            await request(app).put("/customers/123").send({});
            await request(app).delete("/customers/123");

            // Check that all controller methods received the user object
            expect(CustomerController.createCustomer.mock.calls[0][0].user).toBeDefined();
            expect(CustomerController.getCompanyCustomers.mock.calls[0][0].user).toBeDefined();
            expect(CustomerController.getCustomer.mock.calls[0][0].user).toBeDefined();
            expect(CustomerController.updateCustomer.mock.calls[0][0].user).toBeDefined();
            expect(CustomerController.deleteCustomer.mock.calls[0][0].user).toBeDefined();
        });

        it("should apply validation middleware to POST and PUT routes", async () => {
            // Test POST validation
            await request(app).post("/customers").send({}).expect(400);
            expect(CustomerController.createCustomer).not.toHaveBeenCalled();

            // Test valid POST
            await request(app)
                .post("/customers")
                .send({ type: "individual" })
                .expect(201);
            expect(CustomerController.createCustomer).toHaveBeenCalledTimes(1);

            // Test PUT (validation passes for any data in our mock)
            await request(app)
                .put("/customers/123")
                .send({ email: "test@example.com" })
                .expect(200);
            expect(CustomerController.updateCustomer).toHaveBeenCalledTimes(1);
        });
    });
});