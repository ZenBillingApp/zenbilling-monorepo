import request from "supertest";
import express from "express";
import pdfRoutes from "../../src/routes/pdf.routes";
import { PdfController } from "../../src/controllers/pdf.controller";

// Mock du controller
jest.mock("../../src/controllers/pdf.controller");

const app = express();
app.use(express.json());
app.use("/api/pdf", pdfRoutes);

describe("PDF Routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/pdf/invoice", () => {
        it("devrait appeler PdfController.generateInvoicePdf", async () => {
            const mockController = jest.fn().mockImplementation((req, res) => {
                res.setHeader("Content-Type", "application/pdf");
                res.status(200).send(Buffer.from("mock-pdf"));
            });
            
            (PdfController.generateInvoicePdf as jest.Mock).mockImplementation(mockController);

            const requestData = {
                invoice: { invoice_id: "test-123" },
                company: { name: "Test Company" }
            };

            await request(app)
                .post("/api/pdf/invoice")
                .send(requestData)
                .expect(200);

            expect(PdfController.generateInvoicePdf).toHaveBeenCalled();
        });
    });

    describe("POST /api/pdf/quote", () => {
        it("devrait appeler PdfController.generateQuotePdf", async () => {
            const mockController = jest.fn().mockImplementation((req, res) => {
                res.setHeader("Content-Type", "application/pdf");
                res.status(200).send(Buffer.from("mock-quote-pdf"));
            });
            
            (PdfController.generateQuotePdf as jest.Mock).mockImplementation(mockController);

            const requestData = {
                quote: { quote_id: "test-456" },
                company: { name: "Test Company" }
            };

            await request(app)
                .post("/api/pdf/quote")
                .send(requestData)
                .expect(200);

            expect(PdfController.generateQuotePdf).toHaveBeenCalled();
        });
    });

    describe("Route Configuration", () => {
        it("devrait retourner 404 pour les routes non définies", async () => {
            await request(app)
                .get("/api/pdf/invoice")
                .expect(404);

            await request(app)
                .post("/api/pdf/unknown")
                .expect(404);
        });
    });
});