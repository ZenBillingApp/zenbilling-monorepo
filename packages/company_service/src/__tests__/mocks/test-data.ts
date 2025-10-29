import {
    ICompany,
    IUser,
    ICreateCompanyRequest,
    IUpdateCompanyRequest,
} from "@zenbilling/shared";
import { Decimal } from "@prisma/client/runtime/library";

// Mock company data
export const mockCompany: ICompany = {
    company_id: "company-123",
    name: "Test Company SAS",
    legal_form: "SAS",
    siret: "12345678901234",
    siren: "123456789",
    tva_intra: "12345678901234",
    tva_applicable: true,
    RCS_number: "12345678901234",
    RCS_city: "Test City",
    capital: new Decimal(1000000),
    address: "123 Test Street",
    city: "Test City",
    postal_code: "12345",
    country: "France",
    email: "contact@testcompany.com",
    phone: "+33123456789",
    website: "https://testcompany.com",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
};

// Mock user data
export const mockUser: IUser = {
    id: "user-123",
    name: "John Doe",
    email: "john.doe@example.com",
    emailVerified: true,
    onboarding_completed: true,
    onboarding_step: "FINISH",
    stripe_onboarded: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    first_name: "John",
    last_name: "Doe",
};

// Mock create company request
export const mockCreateCompanyRequest: ICreateCompanyRequest = {
    name: "New Company SAS",
    legal_form: "SAS",
    siret: "98765432109876",
    siren: "987654321",
    tva_applicable: true,
    RCS_number: "98765432109876",
    RCS_city: "New City",
    capital: new Decimal(1000000),
    address: "456 New Street",
    city: "New City",
    postal_code: "54321",
    country: "France",
    email: "contact@newcompany.com",
    website: "https://newcompany.com",
};

// Mock update company request
export const mockUpdateCompanyRequest: IUpdateCompanyRequest = {
    name: "Updated Company SAS",
    legal_form: "SAS",
    siret: "98765432109876",
    siren: "987654321",
    tva_applicable: true,
    RCS_number: "98765432109876",
    RCS_city: "New City",
    capital: new Decimal(1000000),
    phone: "+33111222333",
    email: "updated@company.com",
};

// Mock users list
export const mockUsersList: Partial<IUser>[] = [
    {
        id: "user-123",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        onboarding_completed: true,
        onboarding_step: "FINISH",
    },
    {
        id: "user-456",
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com",
        onboarding_completed: false,
        onboarding_step: "CHOOSING_COMPANY",
    },
];

// Mock legal forms
export const mockLegalForms = {
    legalForms: [
        "SAS",
        "SARL",
        "EURL",
        "SASU",
        "SA",
        "SNC",
        "SOCIETE_CIVILE",
        "ENTREPRISE_INDIVIDUELLE",
    ],
};
