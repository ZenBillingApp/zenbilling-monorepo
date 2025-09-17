import {
    ICreateInvoiceRequest,
    IUpdateInvoiceRequest,
    ICreatePaymentRequest,
    Decimal,
    VatRate,
    PaymentMethod,
} from "@zenbilling/shared";

// Données de test pour les factures
export const mockInvoice = {
    invoice_id: "invoice-123",
    customer_id: "customer-123",
    user_id: "user-123",
    company_id: "company-123",
    invoice_number: "FACT-COMP12-202412-001",
    invoice_date: new Date("2024-12-01"),
    due_date: new Date("2024-12-31"),
    amount_excluding_tax: "100.00",
    tax: "20.00",
    amount_including_tax: "120.00",
    status: "pending" as const,
    conditions: "Paiement à 30 jours",
    late_payment_penalty: 0,
    created_at: new Date(),
    updated_at: new Date(),
    items: [
        {
            item_id: "item-123",
            invoice_id: "invoice-123",
            product_id: "product-123",
            name: "Produit Test",
            description: "Description du produit test",
            quantity: 2,
            unit: "unite" as const,
            unit_price_excluding_tax: "50.00",
            vat_rate: "20%" as VatRate,
            product: {
                product_id: "product-123",
                company_id: "company-123",
                name: "Produit Test",
                description: "Description du produit test",
                price_excluding_tax: "50.00",
                vat_rate: "20%" as VatRate,
                unit: "unite" as const,
                created_at: new Date(),
                updated_at: new Date(),
            },
        },
    ],
    payments: [],
    customer: {
        customer_id: "customer-123",
        company_id: "company-123",
        email: "client@test.com",
        phone: "+33123456789",
        created_at: new Date(),
        updated_at: new Date(),
        business: null,
        individual: {
            individual_id: "individual-123",
            customer_id: "customer-123",
            first_name: "Jean",
            last_name: "Dupont",
            created_at: new Date(),
            updated_at: new Date(),
        },
    },
    user: {
        id: "user-123",
        email: "user@test.com",
        first_name: "Admin",
        last_name: "User",
        company_id: "company-123",
        created_at: new Date(),
        updated_at: new Date(),
    },
    company: {
        company_id: "company-123",
        name: "Entreprise Test",
        siret: "12345678901234",
        address: "123 Rue Test",
        city: "Paris",
        postal_code: "75001",
        country: "France",
        created_at: new Date(),
        updated_at: new Date(),
    },
};

export const mockProduct = {
    product_id: "product-123",
    company_id: "company-123",
    name: "Produit Test",
    description: "Description du produit test",
    price_excluding_tax: "50.00",
    vat_rate: "20%" as const,
    unit: "unite" as const,
    created_at: new Date(),
    updated_at: new Date(),
};

export const mockUser = {
    id: "user-123",
    email: "user@test.com",
    first_name: "Admin",
    last_name: "User",
    company_id: "company-123",
    stripe_account_id: "acct_123",
    stripe_onboarded: true,
    created_at: new Date(),
    updated_at: new Date(),
};

export const mockCreateInvoiceRequest: ICreateInvoiceRequest = {
    customer_id: "customer-123",
    invoice_date: new Date("2024-12-01"),
    due_date: new Date("2024-12-31"),
    conditions: "Paiement à 30 jours",
    late_payment_penalty: "0",
    items: [
        {
            product_id: "product-123",
            name: "Produit Test",
            description: "Description du produit test",
            quantity: new Decimal(2),
            unit: "unite" as const,
            unit_price_excluding_tax: new Decimal("50.00"),
            vat_rate: "20%" as VatRate,
            save_as_product: false,
        },
    ],
};

export const mockUpdateInvoiceRequest: IUpdateInvoiceRequest = {
    status: "sent" as const,
    conditions: "Paiement à 15 jours",
};

export const mockCreatePaymentRequest: ICreatePaymentRequest = {
    amount: new Decimal("120.00"),
    payment_method: "card" as PaymentMethod,
    payment_date: new Date(),
    reference: "PAY-123",
    description: "Paiement par carte",
};

export const mockPdfResponse = {
    data: Buffer.from("mock-pdf-data"),
};

export const mockEmailResponse = {
    data: { success: true },
};

export const mockStripeResponse = {
    data: {
        data: {
            url: "https://checkout.stripe.com/pay/cs_test_123",
        },
    },
};
