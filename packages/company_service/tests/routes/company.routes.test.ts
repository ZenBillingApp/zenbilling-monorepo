import request from "supertest";
import express from "express";
import companyRoutes from "../../src/routes/company.routes";
import { CompanyService } from "../../src/services/company.service";
import { LegalForm } from "@zenbilling/shared/src/interfaces/Company.interface";

// Mock des middlewares
jest.mock("@zenbilling/shared/src/middlewares/auth.middleware", () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = {
            id: "user-id-123",
            company_id: "company-id-123",
            email: "test@example.com",
        };
        next();
    },
}));

jest.mock("@zenbilling/shared/src/middlewares/validation.middleware", () => ({
    validateRequest: (schema: any) => (req: any, res: any, next: any) => {
        // Mock validation qui passe toujours
        next();
    },
}));

// Mock du service
jest.mock("../../src/services/company.service");

const app = express();
app.use(express.json());
app.use("/api/company", companyRoutes);

const mockCompany = {
    company_id: "company-id-123",
    name: "Test Company",
    siret: "12345678901234",
    siren: "123456789",
    tva_intra: "FR12345678901",
    tva_applicable: true,
    RCS_number: "RCS123456",
    RCS_city: "Paris",
    capital: 10000,
    legal_form: "SAS",
    address: "123 Rue de la Paix",
    postal_code: "75001",
    city: "Paris",
    country: "France",
    email: "contact@testcompany.com",
    phone: "+33123456789",
    website: "https://testcompany.com",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("Company Routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/company", () => {
        it("devrait créer une entreprise", async () => {
            (CompanyService.createCompany as jest.Mock).mockResolvedValue(
                mockCompany
            );

            const response = await request(app)
                .post("/api/company")
                .send(mockCompany)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Entreprise créée avec succès");
            expect(response.body.data).toEqual(mockCompany);
        });
    });

    describe("GET /api/company", () => {
        it("devrait récupérer une entreprise", async () => {
            (CompanyService.getCompany as jest.Mock).mockResolvedValue(
                mockCompany
            );

            const response = await request(app).get("/api/company").expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Entreprise récupérée avec succès"
            );
            expect(response.body.data).toEqual(mockCompany);
        });
    });

    describe("PUT /api/company", () => {
        it("devrait mettre à jour une entreprise", async () => {
            const updatedData = { name: "Updated Company Name" };
            const updatedCompany = { ...mockCompany, ...updatedData };

            (CompanyService.updateCompany as jest.Mock).mockResolvedValue(
                updatedCompany
            );

            const response = await request(app)
                .put("/api/company")
                .send(updatedData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Entreprise mise à jour avec succès"
            );
            expect(response.body.data).toEqual(updatedCompany);
        });
    });

    describe("GET /api/company/users", () => {
        it("devrait récupérer les utilisateurs de l'entreprise", async () => {
            const mockUsers = [
                {
                    id: "user-id-123",
                    first_name: "John",
                    last_name: "Doe",
                    email: "john@example.com",
                    onboarding_completed: true,
                    onboarding_step: "FINISH",
                },
            ];

            (CompanyService.getCompanyUsers as jest.Mock).mockResolvedValue(
                mockUsers
            );

            const response = await request(app)
                .get("/api/company/users")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Utilisateurs récupérés avec succès"
            );
            expect(response.body.data).toEqual(mockUsers);
        });
    });

    describe("GET /api/company/legal-forms", () => {
        it("devrait retourner les formes légales disponibles", async () => {
            const mockLegalForms = {
                legalForms: [
                    "SAS",
                    "SARL",
                    "EURL",
                    "SASU",
                    "SA",
                    "SNC",
                    "SOCIETE_CIVILE",
                    "ENTREPRISE_INDIVIDUELLE",
                ] as LegalForm[],
            };

            jest.spyOn(
                CompanyService,
                "getAvailableLegalForms"
            ).mockReturnValue(mockLegalForms);

            const response = await request(app)
                .get("/api/company/legal-forms")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Formes légales disponibles");
            expect(response.body.data).toEqual(mockLegalForms);
        });
    });
});
