import request from "supertest";
import express from "express";
import cors from "cors";
import invoiceRoutes from "../../src/routes/invoice.routes";
import { InvoiceService } from "../../src/services/invoice.service";
import {
    createMockInvoice,
    createMockInvoiceData,
    createMockPaymentData,
    createMockUser,
} from "../utils/test-helpers";
import axios from "axios";

// Mock du service
jest.mock("../../src/services/invoice.service");
jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock des middlewares avec des implémentations plus réalistes
jest.mock("@zenbilling/shared/src/middlewares/auth.middleware", () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        // Simule l'extraction d'un token et la validation
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token d'authentification manquant"
            });
        }

        // Simule un utilisateur authentifié
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
    },
}));

jest.mock("@zenbilling/shared/src/middlewares/validation.middleware", () => ({
    validateRequest: (schema: any) => (req: any, res: any, next: any) => {
        // Simule une validation basique
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Données de requête invalides"
            });
        }
        next();
    },
}));

// Configuration de l'application de test
const createTestApp = () => {
    const app = express();
    
    // Configuration CORS similaire à l'app principale
    app.use(cors({
        origin: ["http://localhost:3000", "http://localhost:8080"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    }));

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    
    app.use("/api/invoice", invoiceRoutes);

    // Route de test pour vérifier la santé de l'application
    app.get("/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    return app;
};

describe("Invoice Service Integration Tests", () => {
    let app: express.Application;

    beforeAll(() => {
        app = createTestApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Application Health", () => {
        it("devrait répondre à la route de santé", async () => {
            const response = await request(app)
                .get("/health")
                .expect(200);

            expect(response.body).toEqual({
                status: "ok",
                timestamp: expect.any(String)
            });
        });
    });

    describe("Authentication Flow", () => {
        it("devrait rejeter les requêtes sans authentification", async () => {
            const response = await request(app)
                .get("/api/invoice")
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: "Token d'authentification manquant"
            });
        });

        it("devrait accepter les requêtes avec authentification", async () => {
            (InvoiceService.getCompanyInvoices as jest.Mock).mockResolvedValue({
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
                }
            });

            const response = await request(app)
                .get("/api/invoice")
                .set("Authorization", "Bearer valid-token")
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe("Complete Invoice Workflow", () => {
        const validToken = "Bearer valid-token";

        it("devrait permettre un workflow complet de création à suppression", async () => {
            const mockInvoice = createMockInvoice();
            const invoiceData = createMockInvoiceData();

            // 1. Créer une facture
            (InvoiceService.createInvoice as jest.Mock).mockResolvedValue(mockInvoice);

            const createResponse = await request(app)
                .post("/api/invoice")
                .set("Authorization", validToken)
                .send(invoiceData)
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.message).toBe("Facture créée avec succès");
            expect(InvoiceService.createInvoice).toHaveBeenCalledWith(
                "user-id-123",
                "company-id-123",
                invoiceData
            );

            // 2. Récupérer la facture créée
            (InvoiceService.getInvoiceWithDetails as jest.Mock).mockResolvedValue(mockInvoice);

            const getResponse = await request(app)
                .get(`/api/invoice/${mockInvoice.invoice_id}`)
                .set("Authorization", validToken)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data).toEqual(mockInvoice);

            // 3. Mettre à jour la facture
            const updateData = { status: "sent" };
            const updatedInvoice = { ...mockInvoice, status: "sent" };
            (InvoiceService.updateInvoice as jest.Mock).mockResolvedValue(updatedInvoice);

            const updateResponse = await request(app)
                .put(`/api/invoice/${mockInvoice.invoice_id}`)
                .set("Authorization", validToken)
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(InvoiceService.updateInvoice).toHaveBeenCalledWith(
                mockInvoice.invoice_id,
                "company-id-123",
                updateData
            );

            // 4. Créer un paiement
            const paymentData = createMockPaymentData();
            (InvoiceService.createPayment as jest.Mock).mockResolvedValue({
                payment_id: "payment-id-123",
                ...paymentData
            });

            const paymentResponse = await request(app)
                .post(`/api/invoice/${mockInvoice.invoice_id}/payments`)
                .set("Authorization", validToken)
                .send(paymentData)
                .expect(201);

            expect(paymentResponse.body.success).toBe(true);
            expect(paymentResponse.body.message).toBe("Paiement créé avec succès");

            // 5. Supprimer la facture
            (InvoiceService.deleteInvoice as jest.Mock).mockResolvedValue(undefined);

            await request(app)
                .delete(`/api/invoice/${mockInvoice.invoice_id}`)
                .set("Authorization", validToken)
                .expect(204);

            expect(InvoiceService.deleteInvoice).toHaveBeenCalledWith(
                mockInvoice.invoice_id,
                "company-id-123"
            );
        });

        it("devrait gérer le workflow d'envoi d'email avec PDF", async () => {
            const mockInvoice = createMockInvoice();
            
            // Mock des appels axios pour PDF et email
            mockedAxios.post
                .mockResolvedValueOnce({
                    data: Buffer.from("mock-pdf-content")
                })
                .mockResolvedValueOnce({
                    data: { success: true }
                });

            (InvoiceService.sendInvoiceByEmail as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .post(`/api/invoice/${mockInvoice.invoice_id}/send`)
                .set("Authorization", validToken)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Facture envoyée par email avec succès");
        });

        it("devrait gérer le workflow d'envoi avec lien de paiement", async () => {
            const mockInvoice = createMockInvoice();
            
            // Mock des appels axios
            mockedAxios.post
                .mockResolvedValueOnce({
                    data: Buffer.from("mock-pdf-content")
                })
                .mockResolvedValueOnce({
                    data: { data: { url: "https://checkout.stripe.com/test" } }
                })
                .mockResolvedValueOnce({
                    data: { success: true }
                });

            (InvoiceService.sendInvoiceWithPaymentLink as jest.Mock).mockResolvedValue(undefined);

            const requestData = {
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel"
            };

            const response = await request(app)
                .post(`/api/invoice/${mockInvoice.invoice_id}/send-with-payment-link`)
                .set("Authorization", validToken)
                .send(requestData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Facture envoyée par email avec lien de paiement avec succès");
        });
    });

    describe("Error Handling", () => {
        const validToken = "Bearer valid-token";

        it("devrait gérer les erreurs de service correctement", async () => {
            (InvoiceService.createInvoice as jest.Mock).mockRejectedValue(
                new Error("Erreur de base de données")
            );

            const response = await request(app)
                .post("/api/invoice")
                .set("Authorization", validToken)
                .send(createMockInvoiceData())
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Erreur de base de données");
        });

        it("devrait gérer les erreurs de validation", async () => {
            const response = await request(app)
                .post("/api/invoice")
                .set("Authorization", validToken)
                .send({}) // Données vides pour déclencher la validation
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Données de requête invalides");
        });

        it("devrait gérer les erreurs 404", async () => {
            (InvoiceService.getInvoiceWithDetails as jest.Mock).mockRejectedValue(
                new Error("Facture non trouvée")
            );

            const response = await request(app)
                .get("/api/invoice/nonexistent-id")
                .set("Authorization", validToken)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe("Query Parameters and Filtering", () => {
        const validToken = "Bearer valid-token";

        it("devrait gérer les paramètres de pagination", async () => {
            (InvoiceService.getCompanyInvoices as jest.Mock).mockResolvedValue({
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
                }
            });

            await request(app)
                .get("/api/invoice?page=2&limit=20&status=paid&search=test")
                .set("Authorization", validToken)
                .expect(200);

            expect(InvoiceService.getCompanyInvoices).toHaveBeenCalledWith(
                "company-id-123",
                expect.objectContaining({
                    page: 2,
                    limit: 20,
                    status: "paid",
                    search: "test"
                })
            );
        });

        it("devrait gérer les filtres de date et montant", async () => {
            (InvoiceService.getCompanyInvoices as jest.Mock).mockResolvedValue({
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
                }
            });

            await request(app)
                .get("/api/invoice?start_date=2024-01-01&end_date=2024-12-31&min_amount=100&max_amount=1000")
                .set("Authorization", validToken)
                .expect(200);

            expect(InvoiceService.getCompanyInvoices).toHaveBeenCalledWith(
                "company-id-123",
                expect.objectContaining({
                    start_date: "2024-01-01",
                    end_date: "2024-12-31",
                    min_amount: 100,
                    max_amount: 1000
                })
            );
        });
    });

    describe("Content Type and Large Payloads", () => {
        const validToken = "Bearer valid-token";

        it("devrait gérer les gros payloads JSON", async () => {
            const largeInvoiceData = {
                ...createMockInvoiceData(),
                conditions: "x".repeat(10000), // Grosse chaîne de caractères
                items: Array.from({ length: 100 }, (_, i) => ({
                    name: `Item ${i}`,
                    description: "Description ".repeat(100),
                    quantity: 1,
                    unit_price_excluding_tax: 100,
                    vat_rate: "STANDARD",
                    unit: "unite"
                }))
            };

            (InvoiceService.createInvoice as jest.Mock).mockResolvedValue(createMockInvoice());

            const response = await request(app)
                .post("/api/invoice")
                .set("Authorization", validToken)
                .send(largeInvoiceData)
                .expect(201);

            expect(response.body.success).toBe(true);
        });
    });

    describe("CORS Configuration", () => {
        it("devrait accepter les requêtes CORS des origines autorisées", async () => {
            (InvoiceService.getCompanyInvoices as jest.Mock).mockResolvedValue({
                invoices: [],
                total: 0,
                totalPages: 0,
                statusCounts: { pending: 0, paid: 0, cancelled: 0, sent: 0, late: 0, total: 0 }
            });

            const response = await request(app)
                .get("/api/invoice")
                .set("Authorization", "Bearer valid-token")
                .set("Origin", "http://localhost:3000")
                .expect(200);

            expect(response.header["access-control-allow-origin"]).toBe("http://localhost:3000");
        });
    });
});