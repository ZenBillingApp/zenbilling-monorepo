import request from "supertest";
import express from "express";
import { InvoiceController } from "../../src/controllers/invoice.controller";
import { InvoiceService } from "../../src/services/invoice.service";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import {
    createMockInvoice,
    createMockInvoiceData,
    createMockUpdateInvoiceData,
    createMockPaymentData,
    createMockPayment,
    createMockUser,
} from "../utils/test-helpers";
import axios from "axios";

// Mock du service InvoiceService
jest.mock("../../src/services/invoice.service");
jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = express();
app.use(express.json());

// Mock middleware pour simuler l'authentification
const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = {
        id: "user-id-123",
        company_id: "company-id-123",
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        stripe_account_id: "acct_test123",
        stripe_onboarded: true,
    };
    next();
};

// Routes de test
app.post("/invoices", mockAuthMiddleware, InvoiceController.createInvoice);
app.get("/invoices", mockAuthMiddleware, InvoiceController.getCompanyInvoices);
app.get("/invoices/:id", mockAuthMiddleware, InvoiceController.getInvoice);
app.put("/invoices/:id", mockAuthMiddleware, InvoiceController.updateInvoice);
app.delete("/invoices/:id", mockAuthMiddleware, InvoiceController.deleteInvoice);
app.post("/invoices/:id/payments", mockAuthMiddleware, InvoiceController.createPayment);
app.get("/invoices/:id/pdf", mockAuthMiddleware, InvoiceController.generateInvoicePdf);
app.post("/invoices/:id/send", mockAuthMiddleware, InvoiceController.sendInvoiceByEmail);
app.post("/invoices/:id/send-with-payment-link", mockAuthMiddleware, InvoiceController.sendInvoiceWithPaymentLink);
app.get("/invoices/customer/:customerId", mockAuthMiddleware, InvoiceController.getCustomerInvoices);

const mockInvoice = createMockInvoice();
const mockInvoiceData = createMockInvoiceData();

describe("InvoiceController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /invoices", () => {
        it("devrait créer une facture avec succès", async () => {
            (InvoiceService.createInvoice as jest.Mock).mockResolvedValue(mockInvoice);

            const response = await request(app)
                .post("/invoices")
                .send(mockInvoiceData)
                .expect(201);

            expect(response.body).toEqual({
                success: true,
                message: "Facture créée avec succès",
                data: mockInvoice,
            });

            expect(InvoiceService.createInvoice).toHaveBeenCalledWith(
                "user-id-123",
                "company-id-123",
                mockInvoiceData
            );
        });

        it("devrait retourner une erreur 401 si l'utilisateur n'a pas de société", async () => {
            const appWithoutCompany = express();
            appWithoutCompany.use(express.json());
            appWithoutCompany.post("/invoices", (req: any, res: any, next: any) => {
                req.user = { id: "user-id-123" };
                next();
            }, InvoiceController.createInvoice);

            const response = await request(appWithoutCompany)
                .post("/invoices")
                .send(mockInvoiceData)
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: "Aucune société associée à l'utilisateur",
            });
        });

        it("devrait gérer les erreurs CustomError", async () => {
            const customError = new CustomError("Erreur de validation", 400);
            (InvoiceService.createInvoice as jest.Mock).mockRejectedValue(customError);

            const response = await request(app)
                .post("/invoices")
                .send(mockInvoiceData)
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Erreur de validation",
            });
        });

        it("devrait gérer les erreurs génériques", async () => {
            const error = new Error("Erreur générique");
            (InvoiceService.createInvoice as jest.Mock).mockRejectedValue(error);

            const response = await request(app)
                .post("/invoices")
                .send(mockInvoiceData)
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Erreur générique",
            });
        });
    });

    describe("GET /invoices/:id", () => {
        it("devrait récupérer une facture avec succès", async () => {
            (InvoiceService.getInvoiceWithDetails as jest.Mock).mockResolvedValue(mockInvoice);

            const response = await request(app)
                .get("/invoices/invoice-id-123")
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Facture récupérée avec succès",
                data: mockInvoice,
            });

            expect(InvoiceService.getInvoiceWithDetails).toHaveBeenCalledWith(
                "invoice-id-123",
                "company-id-123"
            );
        });

        it("devrait retourner 404 si la facture n'existe pas", async () => {
            const customError = new CustomError("Facture non trouvée", 404);
            (InvoiceService.getInvoiceWithDetails as jest.Mock).mockRejectedValue(customError);

            const response = await request(app)
                .get("/invoices/nonexistent-id")
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Facture non trouvée",
            });
        });
    });

    describe("PUT /invoices/:id", () => {
        it("devrait mettre à jour une facture avec succès", async () => {
            const updateData = createMockUpdateInvoiceData();
            const updatedInvoice = { ...mockInvoice, ...updateData };
            (InvoiceService.updateInvoice as jest.Mock).mockResolvedValue(updatedInvoice);

            const response = await request(app)
                .put("/invoices/invoice-id-123")
                .send(updateData)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Facture mise à jour avec succès",
                data: updatedInvoice,
            });

            expect(InvoiceService.updateInvoice).toHaveBeenCalledWith(
                "invoice-id-123",
                "company-id-123",
                updateData
            );
        });
    });

    describe("DELETE /invoices/:id", () => {
        it("devrait supprimer une facture avec succès", async () => {
            (InvoiceService.deleteInvoice as jest.Mock).mockResolvedValue(undefined);

            await request(app)
                .delete("/invoices/invoice-id-123")
                .expect(204);

            expect(InvoiceService.deleteInvoice).toHaveBeenCalledWith(
                "invoice-id-123",
                "company-id-123"
            );
        });
    });

    describe("GET /invoices", () => {
        it("devrait récupérer les factures de l'entreprise avec succès", async () => {
            const mockResult = {
                invoices: [mockInvoice],
                total: 1,
                totalPages: 1,
                statusCounts: {
                    pending: 1,
                    paid: 0,
                    cancelled: 0,
                    sent: 0,
                    late: 0,
                    total: 1,
                },
            };
            (InvoiceService.getCompanyInvoices as jest.Mock).mockResolvedValue(mockResult);

            const response = await request(app)
                .get("/invoices")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Factures récupérées avec succès");
            expect(response.body.data.invoices).toEqual([mockInvoice]);
            expect(response.body.data.pagination.total).toBe(1);
            expect(response.body.data.stats.statusCounts.total).toBe(1);
        });

        it("devrait gérer les paramètres de requête", async () => {
            const mockResult = {
                invoices: [],
                total: 0,
                totalPages: 0,
                statusCounts: {
                    pending: 0,
                    paid: 0,
                    cancelled: 0,
                    sent: 0,
                    late: 0,
                    total: 0,
                },
            };
            (InvoiceService.getCompanyInvoices as jest.Mock).mockResolvedValue(mockResult);

            await request(app)
                .get("/invoices?page=2&limit=5&status=paid&search=test")
                .expect(200);

            expect(InvoiceService.getCompanyInvoices).toHaveBeenCalledWith(
                "company-id-123",
                {
                    page: 2,
                    limit: 5,
                    search: "test",
                    status: "paid",
                    customer_id: undefined,
                    start_date: undefined,
                    end_date: undefined,
                    min_amount: undefined,
                    max_amount: undefined,
                    sortBy: undefined,
                    sortOrder: undefined,
                }
            );
        });
    });

    describe("POST /invoices/:id/payments", () => {
        it("devrait créer un paiement avec succès", async () => {
            const paymentData = createMockPaymentData();
            const mockPayment = createMockPayment();
            (InvoiceService.createPayment as jest.Mock).mockResolvedValue(mockPayment);

            const response = await request(app)
                .post("/invoices/invoice-id-123/payments")
                .send(paymentData)
                .expect(201);

            expect(response.body).toEqual({
                success: true,
                message: "Paiement créé avec succès",
                data: mockPayment,
            });

            expect(InvoiceService.createPayment).toHaveBeenCalledWith(
                "invoice-id-123",
                "company-id-123",
                paymentData
            );
        });
    });

    describe("GET /invoices/:id/pdf", () => {
        it("devrait générer et retourner le PDF de la facture", async () => {
            const mockPdfBuffer = Buffer.from("mock-pdf-content");
            (InvoiceService.getInvoiceWithDetails as jest.Mock).mockResolvedValue(mockInvoice);
            mockedAxios.post.mockResolvedValue({
                data: mockPdfBuffer,
            });

            const response = await request(app)
                .get("/invoices/invoice-id-123/pdf")
                .expect(200);

            expect(response.header['content-type']).toBe('application/pdf');
            expect(response.header['content-disposition']).toContain('attachment');
            expect(response.header['content-disposition']).toContain(`facture-${mockInvoice.invoice_number}.pdf`);
        });

        it("devrait retourner 403 si l'utilisateur n'a pas accès à la facture", async () => {
            const invoiceWithDifferentCompany = {
                ...mockInvoice,
                company_id: "different-company-id"
            };
            (InvoiceService.getInvoiceWithDetails as jest.Mock).mockResolvedValue(invoiceWithDifferentCompany);

            const response = await request(app)
                .get("/invoices/invoice-id-123/pdf")
                .expect(403);

            expect(response.body).toEqual({
                success: false,
                message: "Accès non autorisé à cette facture",
            });
        });
    });

    describe("POST /invoices/:id/send", () => {
        it("devrait envoyer une facture par email avec succès", async () => {
            (InvoiceService.sendInvoiceByEmail as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .post("/invoices/invoice-id-123/send")
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Facture envoyée par email avec succès",
            });

            expect(InvoiceService.sendInvoiceByEmail).toHaveBeenCalledWith(
                "invoice-id-123",
                "company-id-123",
                "user-id-123"
            );
        });
    });

    describe("POST /invoices/:id/send-with-payment-link", () => {
        it("devrait envoyer une facture avec lien de paiement avec succès", async () => {
            (InvoiceService.sendInvoiceWithPaymentLink as jest.Mock).mockResolvedValue(undefined);

            const requestBody = {
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel"
            };

            const response = await request(app)
                .post("/invoices/invoice-id-123/send-with-payment-link")
                .send(requestBody)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Facture envoyée par email avec lien de paiement avec succès",
            });

            expect(InvoiceService.sendInvoiceWithPaymentLink).toHaveBeenCalledWith(
                "invoice-id-123",
                "company-id-123",
                expect.objectContaining({
                    id: "user-id-123",
                    company_id: "company-id-123",
                }),
                requestBody
            );
        });

        it("devrait retourner une erreur 400 si les URLs sont manquantes", async () => {
            const response = await request(app)
                .post("/invoices/invoice-id-123/send-with-payment-link")
                .send({})
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Les URLs de succès et d'annulation sont requises pour inclure un lien de paiement",
            });
        });

        it("devrait retourner une erreur 400 si les URLs sont invalides", async () => {
            const response = await request(app)
                .post("/invoices/invoice-id-123/send-with-payment-link")
                .send({
                    successUrl: "invalid-url",
                    cancelUrl: "another-invalid-url"
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Les URLs fournies ne sont pas valides",
            });
        });
    });

    describe("GET /invoices/customer/:customerId", () => {
        it("devrait récupérer les factures d'un client avec succès", async () => {
            const mockResult = {
                invoices: [mockInvoice],
                total: 1,
                totalPages: 1,
            };
            (InvoiceService.getCustomerInvoices as jest.Mock).mockResolvedValue(mockResult);

            const response = await request(app)
                .get("/invoices/customer/customer-id-123")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Factures du client récupérées avec succès");
            expect(response.body.data.invoices).toEqual([mockInvoice]);
            expect(response.body.data.pagination.total).toBe(1);

            expect(InvoiceService.getCustomerInvoices).toHaveBeenCalledWith(
                "customer-id-123",
                "company-id-123",
                expect.any(Object)
            );
        });
    });
});