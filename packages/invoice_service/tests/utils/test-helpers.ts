import { ICreateInvoiceRequest, IUpdateInvoiceRequest, ICreatePaymentRequest, InvoiceStatus, PaymentMethod } from "@zenbilling/shared/src/interfaces/Invoice.request.interface";
import { Decimal } from "@zenbilling/shared/src/libs/prisma";

export const createMockUser = (overrides: Partial<any> = {}) => ({
    id: "user-id-123",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    company_id: "company-id-123",
    stripe_account_id: "acct_test123",
    stripe_onboarded: true,
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

export const createMockProduct = (overrides: Partial<any> = {}) => ({
    product_id: "product-id-123",
    company_id: "company-id-123",
    name: "Test Product",
    description: "A test product",
    price_excluding_tax: new Decimal(100),
    vat_rate: "STANDARD",
    unit: "unite",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
});

export const createMockInvoice = (overrides: Partial<any> = {}) => ({
    invoice_id: "invoice-id-123",
    customer_id: "customer-id-123",
    user_id: "user-id-123",
    company_id: "company-id-123",
    invoice_number: "FACT-comp12-202401-001",
    invoice_date: "2024-01-15T00:00:00.000Z",
    due_date: "2024-02-15T00:00:00.000Z",
    amount_excluding_tax: 100,
    tax: 20,
    amount_including_tax: 120,
    status: "pending" as InvoiceStatus,
    conditions: "Paiement à 30 jours",
    late_payment_penalty: "3% par mois de retard",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    items: [],
    payments: [],
    customer: createMockCustomer(),
    company: createMockCompany(),
    user: createMockUser(),
    ...overrides,
});

export const createMockInvoiceItem = (overrides: Partial<any> = {}) => ({
    item_id: "item-id-123",
    invoice_id: "invoice-id-123",
    product_id: "product-id-123",
    name: "Test Item",
    description: "A test item",
    quantity: new Decimal(1),
    unit: "unite",
    unit_price_excluding_tax: new Decimal(100),
    vat_rate: "STANDARD",
    product: createMockProduct(),
    ...overrides,
});

export const createMockPayment = (overrides: Partial<any> = {}) => ({
    payment_id: "payment-id-123",
    invoice_id: "invoice-id-123",
    payment_date: "2024-01-20T00:00:00.000Z",
    amount: 120,
    payment_method: "credit_card" as PaymentMethod,
    description: "Paiement par carte",
    reference: "REF123456",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
});

export const createMockInvoiceData = (
    overrides: Partial<any> = {}
): any => ({
    customer_id: "customer-id-123",
    invoice_date: "2024-01-15T00:00:00.000Z",
    due_date: "2024-02-15T00:00:00.000Z",
    conditions: "Paiement à 30 jours",
    late_payment_penalty: "3% par mois de retard",
    items: [
        {
            product_id: "product-id-123",
            name: "Test Item",
            description: "A test item",
            quantity: 1,
            unit_price_excluding_tax: 100,
            vat_rate: "STANDARD",
            unit: "unite",
        }
    ],
    ...overrides,
});

export const createMockUpdateInvoiceData = (
    overrides: Partial<IUpdateInvoiceRequest> = {}
): IUpdateInvoiceRequest => ({
    status: "sent" as InvoiceStatus,
    conditions: "Paiement à 30 jours - Modifié",
    ...overrides,
});

export const createMockPaymentData = (
    overrides: Partial<any> = {}
): any => ({
    payment_date: "2024-01-20T00:00:00.000Z",
    amount: 120,
    payment_method: "credit_card" as PaymentMethod,
    description: "Paiement par carte",
    reference: "REF123456",
    ...overrides,
});

export const createMockTransaction = () => {
    const mockTx = {
        invoice: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
        },
        payment: {
            create: jest.fn(),
            aggregate: jest.fn(),
        },
        product: {
            create: jest.fn(),
            findMany: jest.fn(),
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
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
};