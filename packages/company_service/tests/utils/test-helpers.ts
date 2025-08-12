import { ICreateCompanyRequest } from "@zenbilling/shared/src/interfaces/Company.request.interface";
import { LegalForm } from "@zenbilling/shared/src/interfaces/Company.interface";
import { Decimal } from "@zenbilling/shared/src/libs/prisma";

export const createMockUser = (overrides: Partial<any> = {}) => ({
    id: "user-id-123",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    company_id: null,
    onboarding_completed: false,
    onboarding_step: "CHOOSING_COMPANY" as const,
    ...overrides,
});

export const createMockCompany = (overrides: Partial<any> = {}) => ({
    company_id: "company-id-123",
    name: "Test Company SAS",
    siret: "12345678901234",
    siren: "123456789",
    tva_intra: "FR12345678901",
    tva_applicable: true,
    RCS_number: "RCS123456",
    RCS_city: "Paris",
    capital: 10000,
    legal_form: "SAS" as LegalForm,
    address: "123 Rue de la Paix",
    postal_code: "75001",
    city: "Paris",
    country: "France",
    email: "contact@testcompany.com",
    phone: "+33123456789",
    website: "https://testcompany.com",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
});

export const createMockCompanyData = (
    overrides: Partial<ICreateCompanyRequest> = {}
): ICreateCompanyRequest => ({
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
    ...overrides,
});

export const createMockTransaction = () => {
    const mockTx = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        company: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    return {
        mockTx,
        mockTransaction: jest
            .fn()
            .mockImplementation(async (callback) => callback(mockTx)),
    };
};

export const createMockAuthRequest = (userOverrides: Partial<any> = {}) => ({
    user: createMockUser(userOverrides),
    body: {},
    params: {},
    query: {},
});

export const createMockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
