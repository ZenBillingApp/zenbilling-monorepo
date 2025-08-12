import request from "supertest";
import express from "express";
import { CompanyController } from "../../src/controllers/company.controller";
import { CompanyService } from "../../src/services/company.service";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import { LegalForm } from "@zenbilling/shared/src/interfaces/company.interface";

// Mock du service CompanyService
jest.mock("../../src/services/company.service");

const app = express();
app.use(express.json());

// Mock middleware pour simuler l'authentification
const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = {
        id: "user-id-123",
        company_id: "company-id-123",
        email: "test@example.com",
    };
    next();
};

// Routes de test
app.post("/companies", mockAuthMiddleware, CompanyController.createCompany);
app.get("/companies", mockAuthMiddleware, CompanyController.getCompany);
app.put("/companies", mockAuthMiddleware, CompanyController.updateCompany);
app.delete("/companies", mockAuthMiddleware, CompanyController.deleteCompany);
app.get(
    "/companies/users",
    mockAuthMiddleware,
    CompanyController.getCompanyUsers
);
app.get(
    "/companies/legal-forms",
    mockAuthMiddleware,
    CompanyController.getAvailableLegalForms
);

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

const mockUser = {
    id: "user-id-123",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    onboarding_completed: true,
    onboarding_step: "FINISH",
};

describe("CompanyController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /companies", () => {
        it("devrait créer une entreprise avec succès", async () => {
            (CompanyService.createCompany as jest.Mock).mockResolvedValue(
                mockCompany
            );

            const response = await request(app)
                .post("/companies")
                .send(mockCompany)
                .expect(201);

            expect(response.body).toEqual({
                success: true,
                message: "Entreprise créée avec succès",
                data: mockCompany,
            });

            expect(CompanyService.createCompany).toHaveBeenCalledWith(
                mockCompany,
                "user-id-123"
            );
        });

        it("devrait retourner une erreur 401 si l'utilisateur n'est pas authentifié", async () => {
            const appWithoutAuth = express();
            appWithoutAuth.use(express.json());
            appWithoutAuth.post("/companies", CompanyController.createCompany);

            const response = await request(appWithoutAuth)
                .post("/companies")
                .send(mockCompany)
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: "Non autorisé",
            });
        });

        it("devrait retourner une erreur 409 pour un conflit (SIRET existant)", async () => {
            (CompanyService.createCompany as jest.Mock).mockRejectedValue(
                new CustomError("Une entreprise avec ce SIRET existe déjà", 409)
            );

            const response = await request(app)
                .post("/companies")
                .send(mockCompany)
                .expect(409);

            expect(response.body).toEqual({
                success: false,
                message: "Une entreprise avec ce SIRET existe déjà",
            });
        });

        it("devrait retourner une erreur 500 pour une erreur interne", async () => {
            (CompanyService.createCompany as jest.Mock).mockRejectedValue(
                new Error("Erreur de base de données")
            );

            const response = await request(app)
                .post("/companies")
                .send(mockCompany)
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Erreur de base de données",
            });
        });
    });

    describe("GET /companies", () => {
        it("devrait retourner les informations de l'entreprise", async () => {
            (CompanyService.getCompany as jest.Mock).mockResolvedValue(
                mockCompany
            );

            const response = await request(app).get("/companies").expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Entreprise récupérée avec succès",
                data: mockCompany,
            });

            expect(CompanyService.getCompany).toHaveBeenCalledWith(
                "company-id-123"
            );
        });

        it("devrait retourner une erreur 401 si l'utilisateur n'a pas d'entreprise", async () => {
            const appWithUserNoCompany = express();
            appWithUserNoCompany.use(express.json());
            appWithUserNoCompany.use((req: any, res: any, next: any) => {
                req.user = { id: "user-id-123", company_id: null };
                next();
            });
            appWithUserNoCompany.get(
                "/companies",
                CompanyController.getCompany
            );

            const response = await request(appWithUserNoCompany)
                .get("/companies")
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: "Aucune entreprise associée à l'utilisateur",
            });
        });

        it("devrait retourner une erreur 404 si l'entreprise n'existe pas", async () => {
            (CompanyService.getCompany as jest.Mock).mockRejectedValue(
                new CustomError("Entreprise non trouvée", 404)
            );

            const response = await request(app).get("/companies").expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Entreprise non trouvée",
            });
        });
    });

    describe("PUT /companies", () => {
        const updateData = {
            name: "Updated Company Name",
            phone: "+33987654321",
        };

        it("devrait mettre à jour une entreprise avec succès", async () => {
            const updatedCompany = { ...mockCompany, ...updateData };
            (CompanyService.updateCompany as jest.Mock).mockResolvedValue(
                updatedCompany
            );

            const response = await request(app)
                .put("/companies")
                .send(updateData)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Entreprise mise à jour avec succès",
                data: updatedCompany,
            });

            expect(CompanyService.updateCompany).toHaveBeenCalledWith(
                "company-id-123",
                updateData
            );
        });

        it("devrait retourner une erreur 401 si l'utilisateur n'a pas d'entreprise", async () => {
            const appWithUserNoCompany = express();
            appWithUserNoCompany.use(express.json());
            appWithUserNoCompany.use((req: any, res: any, next: any) => {
                req.user = { id: "user-id-123", company_id: null };
                next();
            });
            appWithUserNoCompany.put(
                "/companies",
                CompanyController.updateCompany
            );

            const response = await request(appWithUserNoCompany)
                .put("/companies")
                .send(updateData)
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: "Aucune entreprise associée à l'utilisateur",
            });
        });

        it("devrait retourner une erreur 409 pour un conflit lors de la mise à jour", async () => {
            (CompanyService.updateCompany as jest.Mock).mockRejectedValue(
                new Error("Une entreprise avec ce SIRET existe déjà")
            );

            const response = await request(app)
                .put("/companies")
                .send({ siret: "98765432109876" })
                .expect(409);

            expect(response.body).toEqual({
                success: false,
                message: "Une entreprise avec ce SIRET existe déjà",
            });
        });
    });

    describe("DELETE /companies", () => {
        it("devrait supprimer une entreprise avec succès", async () => {
            (CompanyService.deleteCompany as jest.Mock).mockResolvedValue(
                undefined
            );

            const response = await request(app)
                .delete("/companies")
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Entreprise supprimée avec succès",
            });

            expect(CompanyService.deleteCompany).toHaveBeenCalledWith(
                "company-id-123"
            );
        });

        it("devrait retourner une erreur 401 si l'utilisateur n'a pas d'entreprise", async () => {
            const appWithUserNoCompany = express();
            appWithUserNoCompany.use(express.json());
            appWithUserNoCompany.use((req: any, res: any, next: any) => {
                req.user = { id: "user-id-123", company_id: null };
                next();
            });
            appWithUserNoCompany.delete(
                "/companies",
                CompanyController.deleteCompany
            );

            const response = await request(appWithUserNoCompany)
                .delete("/companies")
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: "Aucune entreprise associée à l'utilisateur",
            });
        });

        it("devrait retourner une erreur 400 pour une erreur lors de la suppression", async () => {
            (CompanyService.deleteCompany as jest.Mock).mockRejectedValue(
                new Error("Impossible de supprimer l'entreprise")
            );

            const response = await request(app)
                .delete("/companies")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Impossible de supprimer l'entreprise",
            });
        });
    });

    describe("GET /companies/users", () => {
        it("devrait retourner les utilisateurs de l'entreprise", async () => {
            const mockUsers = [mockUser];
            (CompanyService.getCompanyUsers as jest.Mock).mockResolvedValue(
                mockUsers
            );

            const response = await request(app)
                .get("/companies/users")
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Utilisateurs récupérés avec succès",
                data: mockUsers,
            });

            expect(CompanyService.getCompanyUsers).toHaveBeenCalledWith(
                "company-id-123"
            );
        });

        it("devrait retourner une erreur 401 si l'utilisateur n'a pas d'entreprise", async () => {
            const appWithUserNoCompany = express();
            appWithUserNoCompany.use(express.json());
            appWithUserNoCompany.use((req: any, res: any, next: any) => {
                req.user = { id: "user-id-123", company_id: null };
                next();
            });
            appWithUserNoCompany.get(
                "/companies/users",
                CompanyController.getCompanyUsers
            );

            const response = await request(appWithUserNoCompany)
                .get("/companies/users")
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: "Aucune entreprise associée à l'utilisateur",
            });
        });

        it("devrait retourner une erreur 400 pour une erreur lors de la récupération", async () => {
            (CompanyService.getCompanyUsers as jest.Mock).mockRejectedValue(
                new Error("Erreur lors de la récupération des utilisateurs")
            );

            const response = await request(app)
                .get("/companies/users")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Erreur lors de la récupération des utilisateurs",
            });
        });
    });

    describe("GET /companies/legal-forms", () => {
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
                .get("/companies/legal-forms")
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Formes légales disponibles",
                data: mockLegalForms,
            });

            expect(CompanyService.getAvailableLegalForms).toHaveBeenCalled();
        });

        it("devrait retourner une erreur 500 pour une erreur interne", async () => {
            jest.spyOn(
                CompanyService,
                "getAvailableLegalForms"
            ).mockImplementation(() => {
                throw new Error("Erreur interne");
            });

            const response = await request(app)
                .get("/companies/legal-forms")
                .expect(500);

            expect(response.body).toEqual({
                success: false,
                message: "Erreur interne du serveur",
            });
        });
    });
});
