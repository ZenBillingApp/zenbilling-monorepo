import { IInvoice } from "@zenbilling/shared/src/interfaces/Invoice.interface";
import { IQuote } from "@zenbilling/shared/src/interfaces/Quote.interface";
import { ICompany } from "@zenbilling/shared/src/interfaces/Company.interface";

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
    ...overrides,
});

export const createMockCustomer = (overrides: Partial<any> = {}) => ({
    customer_id: "customer-id-123",
    user_id: "user-id-123",
    company_id: "company-id-123",
    type: "individual",
    email: "customer@example.com",
    phone: "+33123456789",
    address: "456 Avenue Test",
    city: "Paris",
    postal_code: "75002",
    country: "France",
    individual: {
        customer_id: "customer-id-123",
        first_name: "Jane",
        last_name: "Smith",
    },
    business: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
});

export const createMockBusinessCustomer = (overrides: Partial<any> = {}) => ({
    customer_id: "customer-id-456",
    user_id: "user-id-123",
    company_id: "company-id-123",
    type: "company",
    email: "business@example.com",
    phone: "+33123456789",
    address: "789 Avenue Business",
    city: "Lyon",
    postal_code: "69001",
    country: "France",
    individual: null,
    business: {
        customer_id: "customer-id-456",
        name: "Business Client SAS",
        siret: "98765432109876",
        siren: "987654321",
        tva_intra: "FR98765432109",
        tva_applicable: true,
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
});

export const createMockProduct = (overrides: Partial<any> = {}) => ({
    product_id: "product-id-123",
    company_id: "company-id-123",
    name: "Test Product",
    description: "A test product description",
    price_excluding_tax: 100,
    vat_rate: "STANDARD",
    unit: "unite",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
});

export const createMockInvoiceItem = (overrides: Partial<any> = {}) => ({
    item_id: "item-id-123",
    invoice_id: "invoice-id-123",
    product_id: "product-id-123",
    name: "Test Item",
    description: "A test item description",
    quantity: 2,
    unit: "unite",
    unit_price_excluding_tax: 100,
    vat_rate: "STANDARD",
    product: createMockProduct(),
    ...overrides,
});

export const createMockQuoteItem = (overrides: Partial<any> = {}) => ({
    item_id: "item-id-456",
    quote_id: "quote-id-123",
    product_id: "product-id-123",
    name: "Test Quote Item",
    description: "A test quote item description",
    quantity: 1,
    unit: "unite",
    unit_price_excluding_tax: 150,
    vat_rate: "STANDARD",
    product: createMockProduct({ price_excluding_tax: 150 }),
    ...overrides,
});

export const createMockInvoice = (overrides: Partial<any> = {}): IInvoice => ({
    invoice_id: "invoice-id-123",
    customer_id: "customer-id-123",
    user_id: "user-id-123",
    company_id: "company-id-123",
    invoice_number: "FACT-comp12-202401-001",
    invoice_date: "2024-01-15T00:00:00.000Z",
    due_date: "2024-02-15T00:00:00.000Z",
    amount_excluding_tax: 200,
    tax: 40,
    amount_including_tax: 240,
    status: "pending",
    conditions: "Paiement à 30 jours",
    late_payment_penalty: "3% par mois de retard",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    items: [createMockInvoiceItem()],
    payments: [],
    customer: createMockCustomer(),
    company: createMockCompany(),
    user: {
        id: "user-id-123",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        company_id: "company-id-123",
    },
    ...overrides,
});

export const createMockQuote = (overrides: Partial<any> = {}): IQuote => ({
    quote_id: "quote-id-123",
    customer_id: "customer-id-123",
    user_id: "user-id-123",
    company_id: "company-id-123",
    quote_number: "DEVIS-comp12-202401-001",
    quote_date: "2024-01-10T00:00:00.000Z",
    validity_date: "2024-02-10T00:00:00.000Z",
    amount_excluding_tax: 150,
    tax: 30,
    amount_including_tax: 180,
    status: "draft",
    conditions: "Devis valable 30 jours",
    notes: "Notes pour le devis",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    items: [createMockQuoteItem()],
    customer: createMockCustomer(),
    company: createMockCompany(),
    user: {
        id: "user-id-123",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        company_id: "company-id-123",
    },
    ...overrides,
});

export const createMockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
};

export const createMockRequest = (body: any = {}, params: any = {}) => ({
    body,
    params,
    headers: {},
    query: {},
});