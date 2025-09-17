import { ICompany, IUser, ICreateCompanyRequest, IUpdateCompanyRequest } from "@zenbilling/shared";

// Mock company data
export const mockCompany: ICompany = {
    company_id: "company-123",
    legal_name: "Test Company SAS",
    brand_name: "Test Company",
    legal_form: "SAS",
    siret: "12345678901234",
    siren: "123456789",
    address: "123 Test Street",
    city: "Test City",
    postal_code: "12345",
    country: "France",
    phone: "+33123456789",
    email: "contact@testcompany.com",
    website: "https://testcompany.com",
    description: "Test company description",
    logo_url: "https://example.com/logo.png",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
};

// Mock user data
export const mockUser: IUser = {
    id: "user-123",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+33123456789",
    company_id: "company-123",
    onboarding_completed: true,
    onboarding_step: "FINISH",
    stripe_account_id: "acct_test123",
    stripe_onboarded: true,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
};

// Mock create company request
export const mockCreateCompanyRequest: ICreateCompanyRequest = {
    legal_name: "New Company SAS",
    brand_name: "New Company",
    legal_form: "SAS",
    siret: "98765432109876",
    siren: "987654321",
    address: "456 New Street",
    city: "New City",
    postal_code: "54321",
    country: "France",
    phone: "+33987654321",
    email: "contact@newcompany.com",
    website: "https://newcompany.com",
    description: "New company description",
    logo_url: "https://example.com/new-logo.png",
};

// Mock update company request
export const mockUpdateCompanyRequest: IUpdateCompanyRequest = {
    legal_name: "Updated Company SAS",
    brand_name: "Updated Company",
    phone: "+33111222333",
    email: "updated@company.com",
    description: "Updated company description",
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