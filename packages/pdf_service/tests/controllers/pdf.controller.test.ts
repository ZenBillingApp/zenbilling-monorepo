import request from "supertest";
import express from "express";
import { PdfController } from "../../src/controllers/pdf.controller";
import { PdfService } from "../../src/services/pdf.service";

// Mock du service PdfService
jest.mock("../../src/services/pdf.service");

const app = express();
app.use(express.json());

// Routes de test
app.post("/pdf/invoice", PdfController.generateInvoicePdf);
app.post("/pdf/quote", PdfController.generateQuotePdf);

const mockInvoice = {
    invoice_id: "invoice-123",
    invoice_number: "FACT-001",
    customer: { email: "test@example.com" },
    items: []
};

const mockQuote = {
    quote_id: "quote-123",
    quote_number: "DEVIS-001",
    customer: { email: "test@example.com" },
    items: []
};

const mockCompany = {
    company_id: "company-123",
    name: "Test Company",
    address: "123 Test St"
};

describe("PdfController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /pdf/invoice", () => {
        it("devrait générer un PDF de facture avec succès", async () => {
            const mockPdfBuffer = Buffer.from("mock-pdf-content");
            (PdfService.generateInvoicePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

            const response = await request(app)
                .post("/pdf/invoice")
                .send({
                    invoice: mockInvoice,
                    company: mockCompany
                })
                .expect(200);

            expect(response.header['content-type']).toBe('application/pdf');
            expect(PdfService.generateInvoicePdf).toHaveBeenCalledWith(mockInvoice, mockCompany);
        });

        it("devrait retourner une erreur 400 si les données sont manquantes", async () => {
            const response = await request(app)
                .post("/pdf/invoice")
                .send({})
                .expect(400);

            expect(response.body.error).toBe("Les données de facture et d'entreprise sont requises");
        });

        it("devrait gérer les erreurs du service", async () => {
            const error = new Error("Erreur de génération PDF");
            (PdfService.generateInvoicePdf as jest.Mock).mockRejectedValue(error);

            const response = await request(app)
                .post("/pdf/invoice")
                .send({
                    invoice: mockInvoice,
                    company: mockCompany
                })
                .expect(500);

            expect(response.body.error).toBe("Erreur lors de la génération du PDF");
        });
    });

    describe("POST /pdf/quote", () => {
        it("devrait générer un PDF de devis avec succès", async () => {
            const mockPdfBuffer = Buffer.from("mock-quote-pdf-content");
            (PdfService.generateQuotePdf as jest.Mock).mockResolvedValue(mockPdfBuffer);

            const response = await request(app)
                .post("/pdf/quote")
                .send({
                    quote: mockQuote,
                    company: mockCompany
                })
                .expect(200);

            expect(response.header['content-type']).toBe('application/pdf');
            expect(PdfService.generateQuotePdf).toHaveBeenCalledWith(mockQuote, mockCompany);
        });

        it("devrait retourner une erreur 400 si les données sont manquantes", async () => {
            const response = await request(app)
                .post("/pdf/quote")
                .send({})
                .expect(400);

            expect(response.body.error).toBe("Les données de devis et d'entreprise sont requises");
        });
    });
});