import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import companyRoutes from "../../src/routes/company.routes";
import { CompanyService } from "../../src/services/company.service";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import { LegalForm } from "@zenbilling/shared/src/interfaces/company.interface";

// Mock des middlewares et services
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
    validateRequest: (schema: any) => (req: any, res: any, next: any) => next(),
}));

jest.mock("../../src/services/company.service");

// Configuration de l'application de test similaire à l'app réelle
const createTestApp = () => {
    const app = express();

    app.use(
        cors({
            origin: ["http://localhost:3000", "http://localhost:8080"],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            credentials: true,
        })
    );

    app.use(helmet());
    app.use(express.json());

    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: {
                success: false,
                message: "Trop de requêtes. Veuillez réessayer plus tard.",
                error: "RATE_LIMIT_EXCEEDED",
            },
            standardHeaders: true,
            legacyHeaders: false,
        })
    );

    app.use("/api/company", companyRoutes);

    return app;
};

describe("Company Service Integration Tests", () => {
    let app: express.Application;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    describe("Flux complet de gestion d'entreprise", () => {
        it("devrait permettre de créer, récupérer, mettre à jour et supprimer une entreprise", async () => {
            const mockCompany = {
                company_id: "company-id-123",
                name: "Test Company SAS",
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

            // 1. Création d'une entreprise
            (CompanyService.createCompany as jest.Mock).mockResolvedValue(
                mockCompany
            );

            const createResponse = await request(app)
                .post("/api/company")
                .send({
                    name: "Test Company SAS",
                    siret: "12345678901234",
                    siren: "123456789",
                    legal_form: "SAS",
                    address: "123 Rue de la Paix",
                    postal_code: "75001",
                    city: "Paris",
                    country: "France",
                })
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data).toEqual(mockCompany);

            // 2. Récupération de l'entreprise
            (CompanyService.getCompany as jest.Mock).mockResolvedValue(
                mockCompany
            );

            const getResponse = await request(app)
                .get("/api/company")
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data).toEqual(mockCompany);

            // 3. Mise à jour de l'entreprise
            const updatedCompany = {
                ...mockCompany,
                name: "Updated Company Name",
            };
            (CompanyService.updateCompany as jest.Mock).mockResolvedValue(
                updatedCompany
            );

            const updateResponse = await request(app)
                .put("/api/company")
                .send({ name: "Updated Company Name" })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.name).toBe("Updated Company Name");

            // 4. Récupération des utilisateurs
            const mockUsers = [
                {
                    id: "user-id-123",
                    first_name: "John",
                    last_name: "Doe",
                    email: "john@example.com",
                },
            ];
            (CompanyService.getCompanyUsers as jest.Mock).mockResolvedValue(
                mockUsers
            );

            const usersResponse = await request(app)
                .get("/api/company/users")
                .expect(200);

            expect(usersResponse.body.success).toBe(true);
            expect(usersResponse.body.data).toEqual(mockUsers);
        });

        it("devrait gérer les erreurs de validation et les conflits", async () => {
            // Test d'erreur de conflit SIRET
            (CompanyService.createCompany as jest.Mock).mockRejectedValue(
                new CustomError("Une entreprise avec ce SIRET existe déjà", 409)
            );

            const conflictResponse = await request(app)
                .post("/api/company")
                .send({
                    name: "Test Company",
                    siret: "12345678901234", // SIRET existant
                    siren: "123456789",
                    legal_form: "SAS",
                })
                .expect(409);

            expect(conflictResponse.body.success).toBe(false);
            expect(conflictResponse.body.message).toBe(
                "Une entreprise avec ce SIRET existe déjà"
            );

            // Test d'erreur 404 - entreprise non trouvée
            (CompanyService.getCompany as jest.Mock).mockRejectedValue(
                new CustomError("Entreprise non trouvée", 404)
            );

            const notFoundResponse = await request(app)
                .get("/api/company")
                .expect(404);

            expect(notFoundResponse.body.success).toBe(false);
            expect(notFoundResponse.body.message).toBe(
                "Entreprise non trouvée"
            );
        });

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
            expect(response.body.data.legalForms).toHaveLength(8);
            expect(response.body.data.legalForms).toContain("SAS");
            expect(response.body.data.legalForms).toContain("SARL");
        });
    });

    describe("Test de sécurité et middleware", () => {
        it("devrait avoir les headers de sécurité appropriés", async () => {
            jest.spyOn(
                CompanyService,
                "getAvailableLegalForms"
            ).mockReturnValue({
                legalForms: ["SAS"],
            });

            const response = await request(app)
                .get("/api/company/legal-forms")
                .expect(200);

            // Vérification des headers de sécurité ajoutés par Helmet
            expect(response.headers["x-content-type-options"]).toBe("nosniff");
            expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
        });

        it("devrait supporter CORS pour les origines autorisées", async () => {
            jest.spyOn(
                CompanyService,
                "getAvailableLegalForms"
            ).mockReturnValue({
                legalForms: ["SAS"],
            });

            const response = await request(app)
                .get("/api/company/legal-forms")
                .set("Origin", "http://localhost:3000")
                .expect(200);

            expect(response.headers["access-control-allow-origin"]).toBe(
                "http://localhost:3000"
            );
        });
    });

    describe("Gestion d'erreurs globale", () => {
        it("devrait gérer les erreurs inattendues", async () => {
            (CompanyService.createCompany as jest.Mock).mockRejectedValue(
                new Error("Erreur de base de données inattendue")
            );

            const response = await request(app)
                .post("/api/company")
                .send({
                    name: "Test Company",
                    siret: "12345678901234",
                    siren: "123456789",
                    legal_form: "SAS",
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(
                "Erreur de base de données inattendue"
            );
        });

        it("devrait retourner 500 pour les erreurs non gérées", async () => {
            (CompanyService.createCompany as jest.Mock).mockRejectedValue(
                { message: "Erreur sans type défini" } // Objet d'erreur non standard
            );

            const response = await request(app)
                .post("/api/company")
                .send({
                    name: "Test Company",
                    siret: "12345678901234",
                    siren: "123456789",
                    legal_form: "SAS",
                })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Erreur interne du serveur");
        });
    });
});
