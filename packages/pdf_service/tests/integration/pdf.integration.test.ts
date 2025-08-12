import request from "supertest";
import express from "express";
import cors from "cors";
import pdfRoutes from "../../src/routes/pdf.routes";
import { PdfService } from "../../src/services/pdf.service";

// Mock du service
jest.mock("../../src/services/pdf.service");

// Configuration de l'application de test
const createTestApp = () => {
    const app = express();
    
    app.use(cors({
        origin: ["http://localhost:3000", "http://localhost:8080"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    }));

    app.use(express.json());
    app.use("/api/pdf", pdfRoutes);

    app.get("/health", (req, res) => {
        res.json({ status: "ok", service: "pdf", timestamp: new Date().toISOString() });
    });

    return app;
};

const mockInvoice = {
    invoice_id: "integration-invoice-123",
    invoice_number: "FACT-INT-001",
    customer: { email: "integration@example.com" },
    items: [],
    amount_including_tax: 240
};

const mockQuote = {
    quote_id: "integration-quote-123",
    quote_number: "DEVIS-INT-001",
    customer: { email: "integration@example.com" },
    items: [],
    amount_including_tax: 180
};

const mockCompany = {
    company_id: "integration-company-123",
    name: "Integration Test Company",
    address: "123 Integration St"
};

describe("PDF Service Integration Tests", () => {
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
                service: "pdf",
                timestamp: expect.any(String)
            });
        });
    });

    describe("Complete PDF Generation Workflow", () => {
        describe("Invoice PDF Generation", () => {
            it("devrait générer un PDF de facture de bout en bout", async () => {
                const mockPdfBuffer = Buffer.from("integration-test-invoice-pdf");
                (PdfService.generateInvoicePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

                const response = await request(app)
                    .post("/api/pdf/invoice")
                    .send({ invoice: mockInvoice, company: mockCompany })
                    .expect(200);

                expect(response.header['content-type']).toBe('application/pdf');
                expect(PdfService.generateInvoicePdf).toHaveBeenCalledWith(mockInvoice, mockCompany);
            });
        });

        describe("Quote PDF Generation", () => {
            it("devrait générer un PDF de devis de bout en bout", async () => {
                const mockPdfBuffer = Buffer.from("integration-test-quote-pdf");
                (PdfService.generateQuotePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

                const response = await request(app)
                    .post("/api/pdf/quote")
                    .send({ quote: mockQuote, company: mockCompany })
                    .expect(200);

                expect(response.header['content-type']).toBe('application/pdf');
                expect(PdfService.generateQuotePdf).toHaveBeenCalledWith(mockQuote, mockCompany);
            });
        });
    });

    describe("Error Handling", () => {
        it("devrait gérer les erreurs de service pour les factures", async () => {
            (PdfService.generateInvoicePdf as jest.Mock).mockRejectedValue(
                new Error("Erreur de génération PDF")
            );

            const response = await request(app)
                .post("/api/pdf/invoice")
                .send({ invoice: mockInvoice, company: mockCompany })
                .expect(500);

            expect(response.body.error).toBe("Erreur lors de la génération du PDF");
        });

        it("devrait valider les données d'entrée", async () => {
            const response = await request(app)
                .post("/api/pdf/invoice")
                .send({})
                .expect(400);

            expect(response.body.error).toBe("Les données de facture et d'entreprise sont requises");
        });
    });

    describe("CORS Configuration", () => {
        it("devrait accepter les requêtes CORS des origines autorisées", async () => {
            const mockPdfBuffer = Buffer.from("cors-test-pdf");
            (PdfService.generateInvoicePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

            const response = await request(app)
                .post("/api/pdf/invoice")
                .set("Origin", "http://localhost:3000")
                .send({ invoice: mockInvoice, company: mockCompany })
                .expect(200);

            expect(response.header["access-control-allow-origin"]).toBe("http://localhost:3000");
        });
    });

    describe("Performance", () => {
        it("devrait gérer plusieurs requêtes simultanées", async () => {
            const mockPdfBuffer = Buffer.from("concurrent-test-pdf");
            (PdfService.generateInvoicePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);
            (PdfService.generateQuotePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

            const invoicePromises = Array.from({ length: 3 }, () =>
                request(app)
                    .post("/api/pdf/invoice")
                    .send({ invoice: mockInvoice, company: mockCompany })
            );

            const quotePromises = Array.from({ length: 2 }, () =>
                request(app)
                    .post("/api/pdf/quote")
                    .send({ quote: mockQuote, company: mockCompany })
            );

            const responses = await Promise.all([...invoicePromises, ...quotePromises]);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.header['content-type']).toBe('application/pdf');
            });

            expect(PdfService.generateInvoicePdf).toHaveBeenCalledTimes(3);
            expect(PdfService.generateQuotePdf).toHaveBeenCalledTimes(2);
        });
    });
});