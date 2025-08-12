import { CompanyService } from "../../src/services/company.service";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import {
    ICreateCompanyRequest,
    IUpdateCompanyRequest,
} from "@zenbilling/shared/src/interfaces/Company.request.interface";
import { LegalForm } from "@zenbilling/shared/src/interfaces/Company.interface";
import prisma, { Decimal } from "@zenbilling/shared/src/libs/prisma";

// Mock des données de test
const mockUser = {
    id: "user-id-123",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    company_id: null,
    onboarding_completed: false,
    onboarding_step: "CHOOSING_COMPANY" as const,
};

const mockCompanyData: ICreateCompanyRequest = {
    name: "Test Company SAS",
    siret: "12345678901234",
    siren: "123456789",
    tva_intra: "FR12345678901",
    tva_applicable: true,
    RCS_number: "RCS123456",
    RCS_city: "Paris",
    capital: new Decimal(10000),
    legal_form: "SAS" as LegalForm,
    address: "123 Rue de la Paix",
    postal_code: "75001",
    city: "Paris",
    country: "France",
    email: "contact@testcompany.com",
    phone: "+33123456789",
    website: "https://testcompany.com",
};

const mockCompany = {
    company_id: "company-id-123",
    ...mockCompanyData,
    capital: 10000, // Convert Decimal to number for comparison
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockTransaction = jest.fn();

describe("CompanyService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.$transaction as jest.Mock).mockImplementation(mockTransaction);
    });

    describe("getAvailableLegalForms", () => {
        it("devrait retourner toutes les formes légales disponibles", () => {
            const result = CompanyService.getAvailableLegalForms();

            expect(result).toEqual({
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
            });
        });
    });

    describe("createCompany", () => {
        it("devrait créer une entreprise avec succès", async () => {
            // Mock de la méthode privée validateUniqueFields
            jest.spyOn(CompanyService as any, 'validateUniqueFields').mockResolvedValue(undefined);

            const mockTx = {
                user: {
                    findUnique: jest.fn().mockResolvedValue(mockUser),
                    update: jest
                        .fn()
                        .mockResolvedValue({
                            ...mockUser,
                            company_id: mockCompany.company_id,
                        }),
                },
                company: {
                    create: jest.fn().mockResolvedValue(mockCompany),
                    findFirst: jest.fn().mockResolvedValue(null),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            const result = await CompanyService.createCompany(
                mockCompanyData,
                mockUser.id
            );

            expect(result).toEqual(mockCompany);
            expect(mockTx.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id },
            });
            expect(mockTx.company.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: mockCompanyData.name,
                    siret: mockCompanyData.siret,
                    siren: mockCompanyData.siren,
                }),
            });
            expect(mockTx.user.update).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: {
                    company_id: mockCompany.company_id,
                    onboarding_step: "STRIPE_SETUP",
                },
            });
        });

        it("devrait lever une erreur si l'utilisateur n'existe pas", async () => {
            const mockTx = {
                user: {
                    findUnique: jest.fn().mockResolvedValue(null),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await expect(
                CompanyService.createCompany(mockCompanyData, "invalid-user-id")
            ).rejects.toThrow(new CustomError("Utilisateur non trouvé", 404));
        });

        it("devrait lever une erreur si l'utilisateur a déjà une entreprise", async () => {
            const userWithCompany = {
                ...mockUser,
                company_id: "existing-company-id",
            };

            const mockTx = {
                user: {
                    findUnique: jest.fn().mockResolvedValue(userWithCompany),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await expect(
                CompanyService.createCompany(mockCompanyData, mockUser.id)
            ).rejects.toThrow(
                new CustomError("Vous possédez déjà une entreprise", 409)
            );
        });

        it("devrait lever une erreur si le SIRET existe déjà", async () => {
            // Mock de validateUniqueFields pour qu'elle lance une erreur
            jest.spyOn(CompanyService as any, 'validateUniqueFields').mockRejectedValue(
                new CustomError("Une entreprise avec ce SIRET existe déjà", 409)
            );

            const mockTx = {
                user: {
                    findUnique: jest.fn().mockResolvedValue(mockUser),
                },
                company: {
                    findFirst: jest.fn(),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await expect(
                CompanyService.createCompany(mockCompanyData, mockUser.id)
            ).rejects.toThrow(
                new CustomError("Une entreprise avec ce SIRET existe déjà", 409)
            );
        });

        it("devrait lever une erreur si le SIREN existe déjà", async () => {
            // Mock de validateUniqueFields pour qu'elle lance une erreur
            jest.spyOn(CompanyService as any, 'validateUniqueFields').mockRejectedValue(
                new CustomError("Une entreprise avec ce SIREN existe déjà", 409)
            );

            const mockTx = {
                user: {
                    findUnique: jest.fn().mockResolvedValue(mockUser),
                },
                company: {
                    findFirst: jest.fn(),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await expect(
                CompanyService.createCompany(mockCompanyData, mockUser.id)
            ).rejects.toThrow(
                new CustomError("Une entreprise avec ce SIREN existe déjà", 409)
            );
        });
    });

    describe("getCompany", () => {
        it("devrait retourner les informations de l'entreprise", async () => {
            const companyWithUsers = {
                ...mockCompany,
                users: [
                    {
                        id: mockUser.id,
                        first_name: mockUser.first_name,
                        last_name: mockUser.last_name,
                        email: mockUser.email,
                    },
                ],
            };

            (prisma.company.findUnique as jest.Mock).mockResolvedValue(
                companyWithUsers
            );

            const result = await CompanyService.getCompany(
                mockCompany.company_id
            );

            expect(result).toEqual(companyWithUsers);
            expect(prisma.company.findUnique).toHaveBeenCalledWith({
                where: { company_id: mockCompany.company_id },
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            });
        });

        it("devrait lever une erreur si l'entreprise n'existe pas", async () => {
            (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                CompanyService.getCompany("non-existent-company-id")
            ).rejects.toThrow(new CustomError("Entreprise non trouvée", 404));
        });
    });

    describe("updateCompany", () => {
        const updateData: IUpdateCompanyRequest = {
            name: "Updated Company Name",
            phone: "+33987654321",
        };

        it("devrait mettre à jour une entreprise avec succès", async () => {
            const updatedCompany = { ...mockCompany, ...updateData };

            // Mock de validateUniqueFields pour ne pas lancer d'erreur
            jest.spyOn(CompanyService as any, 'validateUniqueFields').mockResolvedValue(undefined);

            const mockTx = {
                company: {
                    findUnique: jest.fn().mockResolvedValue(mockCompany),
                    update: jest.fn().mockResolvedValue(updatedCompany),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            const result = await CompanyService.updateCompany(
                mockCompany.company_id,
                updateData
            );

            expect(result).toEqual(updatedCompany);
            expect(mockTx.company.findUnique).toHaveBeenCalledWith({
                where: { company_id: mockCompany.company_id },
            });
            expect(mockTx.company.update).toHaveBeenCalledWith({
                where: { company_id: mockCompany.company_id },
                data: updateData,
            });
        });

        it("devrait lever une erreur si l'entreprise n'existe pas lors de la mise à jour", async () => {
            const mockTx = {
                company: {
                    findUnique: jest.fn().mockResolvedValue(null),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await expect(
                CompanyService.updateCompany(
                    "non-existent-company-id",
                    updateData
                )
            ).rejects.toThrow(new CustomError("Entreprise non trouvée", 404));
        });

        it("devrait valider l'unicité du SIRET lors de la mise à jour", async () => {
            const updateDataWithSiret = { siret: "98765432109876" };
            
            // Mock de validateUniqueFields pour qu'elle lance une erreur
            jest.spyOn(CompanyService as any, 'validateUniqueFields').mockRejectedValue(
                new CustomError("Une entreprise avec ce SIRET existe déjà", 409)
            );

            const mockTx = {
                company: {
                    findUnique: jest.fn().mockResolvedValue(mockCompany),
                    findFirst: jest.fn(),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await expect(
                CompanyService.updateCompany(
                    mockCompany.company_id,
                    updateDataWithSiret
                )
            ).rejects.toThrow(
                new CustomError("Une entreprise avec ce SIRET existe déjà", 409)
            );
        });
    });

    describe("deleteCompany", () => {
        it("devrait supprimer une entreprise avec succès", async () => {
            const mockTx = {
                company: {
                    findUnique: jest.fn().mockResolvedValue(mockCompany),
                    delete: jest.fn().mockResolvedValue(mockCompany),
                },
                user: {
                    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await CompanyService.deleteCompany(mockCompany.company_id);

            expect(mockTx.company.findUnique).toHaveBeenCalledWith({
                where: { company_id: mockCompany.company_id },
            });
            expect(mockTx.user.updateMany).toHaveBeenCalledWith({
                where: { company_id: mockCompany.company_id },
                data: {
                    company_id: null,
                    onboarding_completed: false,
                    onboarding_step: "CHOOSING_COMPANY",
                },
            });
            expect(mockTx.company.delete).toHaveBeenCalledWith({
                where: { company_id: mockCompany.company_id },
            });
        });

        it("devrait lever une erreur si l'entreprise n'existe pas lors de la suppression", async () => {
            const mockTx = {
                company: {
                    findUnique: jest.fn().mockResolvedValue(null),
                },
            };

            mockTransaction.mockImplementation(async (callback) =>
                callback(mockTx)
            );

            await expect(
                CompanyService.deleteCompany("non-existent-company-id")
            ).rejects.toThrow(new CustomError("Entreprise non trouvée", 404));
        });
    });

    describe("getCompanyUsers", () => {
        it("devrait retourner les utilisateurs d'une entreprise", async () => {
            const companyWithUsers = {
                ...mockCompany,
                users: [
                    {
                        id: mockUser.id,
                        first_name: mockUser.first_name,
                        last_name: mockUser.last_name,
                        email: mockUser.email,
                        onboarding_completed: mockUser.onboarding_completed,
                        onboarding_step: mockUser.onboarding_step,
                    },
                ],
            };

            (prisma.company.findUnique as jest.Mock).mockResolvedValue(
                companyWithUsers
            );

            const result = await CompanyService.getCompanyUsers(
                mockCompany.company_id
            );

            expect(result).toEqual(companyWithUsers.users);
            expect(prisma.company.findUnique).toHaveBeenCalledWith({
                where: { company_id: mockCompany.company_id },
                include: {
                    users: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                            onboarding_completed: true,
                            onboarding_step: true,
                        },
                    },
                },
            });
        });

        it("devrait lever une erreur si l'entreprise n'existe pas", async () => {
            (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                CompanyService.getCompanyUsers("non-existent-company-id")
            ).rejects.toThrow(new CustomError("Entreprise non trouvée", 404));
        });
    });
});
