import { PdfService } from "../../src/services/pdf.service";

// Mock de Puppeteer avec structure simplifiée
jest.mock("puppeteer", () => {
    const mockPage = {
        setViewport: jest.fn(),
        setContent: jest.fn(),
        emulateMediaType: jest.fn(),
        pdf: jest.fn().mockResolvedValue(Buffer.from("mock-pdf-content")),
        close: jest.fn(),
    };

    const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn(),
    };

    return {
        __esModule: true,
        default: {
            launch: jest.fn().mockResolvedValue(mockBrowser),
        },
    };
});

// Mock de Handlebars
jest.mock("handlebars", () => {
    const mockTemplateFunction = jest.fn().mockReturnValue("<html>Mock template rendered</html>");
    
    return {
        __esModule: true,
        default: {
            compile: jest.fn().mockReturnValue(mockTemplateFunction),
            registerHelper: jest.fn(),
        },
        compile: jest.fn().mockReturnValue(mockTemplateFunction),
        registerHelper: jest.fn(),
    };
});

// Mock de fs
jest.mock("fs", () => ({
    readFileSync: jest.fn().mockReturnValue("<html>Mock template</html>"),
}));

// Mock de path
jest.mock("path", () => ({
    join: jest.fn().mockReturnValue("/mock/path/template.html"),
}));

// Mock du logger
jest.mock("@zenbilling/shared/src/utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

const mockInvoice = {
    invoice_id: "invoice-123",
    invoice_number: "FACT-001",
    customer: { email: "test@example.com" },
    items: [],
    amount_excluding_tax: 100,
    tax: 20,
    amount_including_tax: 120
};

const mockQuote = {
    quote_id: "quote-123",
    quote_number: "DEVIS-001",
    customer: { email: "test@example.com" },
    items: [],
    amount_excluding_tax: 100,
    tax: 20,
    amount_including_tax: 120
};

const mockCompany = {
    company_id: "company-123",
    name: "Test Company",
    address: "123 Test St",
    city: "Paris",
    postal_code: "75001"
};

describe("PdfService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("generateInvoicePdf", () => {
        it("devrait générer un PDF de facture avec succès", async () => {
            const result = await PdfService.generateInvoicePdf(mockInvoice as any, mockCompany as any);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toBe("mock-pdf-content");
        });

        it("devrait lever une erreur si la facture n'est pas fournie", async () => {
            await expect(
                PdfService.generateInvoicePdf(null as any, mockCompany as any)
            ).rejects.toThrow("Cannot read properties of null");
        });
    });

    describe("generateQuotePdf", () => {
        it("devrait générer un PDF de devis avec succès", async () => {
            const result = await PdfService.generateQuotePdf(mockQuote as any, mockCompany as any);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.toString()).toBe("mock-pdf-content");
        });

        it("devrait lever une erreur si le devis n'est pas fourni", async () => {
            await expect(
                PdfService.generateQuotePdf(null as any, mockCompany as any)
            ).rejects.toThrow("Cannot read properties of null");
        });
    });
});