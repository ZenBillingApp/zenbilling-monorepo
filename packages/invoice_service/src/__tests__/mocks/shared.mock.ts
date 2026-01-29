import { jest } from "@jest/globals";

// Minimal Decimal mock for tests
export class Decimal {
    private value: string;

    constructor(value: string | number) {
        this.value = String(value);
    }

    toString(): string {
        return this.value;
    }

    toNumber(): number {
        return parseFloat(this.value);
    }

    static sum(...values: (Decimal | string | number)[]): Decimal {
        const total = values.reduce((acc: number, val) => {
            const num =
                val instanceof Decimal ? val.toNumber() : parseFloat(String(val));
            return acc + num;
        }, 0);
        return new Decimal(total.toString());
    }

    mul(other: Decimal | string | number): Decimal {
        const otherNum =
            other instanceof Decimal
                ? other.toNumber()
                : parseFloat(String(other));
        return new Decimal((this.toNumber() * otherNum).toString());
    }

    div(other: Decimal | string | number): Decimal {
        const otherNum =
            other instanceof Decimal
                ? other.toNumber()
                : parseFloat(String(other));
        return new Decimal((this.toNumber() / otherNum).toString());
    }

    plus(other: Decimal | string | number): Decimal {
        const otherNum =
            other instanceof Decimal
                ? other.toNumber()
                : parseFloat(String(other));
        return new Decimal((this.toNumber() + otherNum).toString());
    }

    toFixed(decimals: number): string {
        return this.toNumber().toFixed(decimals);
    }
}

// Mock Prisma Client
export const mockPrisma = {
    $transaction: jest.fn() as jest.MockedFunction<any>,
    invoice: {
        create: jest.fn() as jest.MockedFunction<any>,
        findUnique: jest.fn() as jest.MockedFunction<any>,
        findMany: jest.fn() as jest.MockedFunction<any>,
        update: jest.fn() as jest.MockedFunction<any>,
        updateMany: jest.fn() as jest.MockedFunction<any>,
        delete: jest.fn() as jest.MockedFunction<any>,
        count: jest.fn() as jest.MockedFunction<any>,
    },
    product: {
        findMany: jest.fn() as jest.MockedFunction<any>,
        create: jest.fn() as jest.MockedFunction<any>,
    },
    payment: {
        create: jest.fn() as jest.MockedFunction<any>,
        aggregate: jest.fn() as jest.MockedFunction<any>,
    },
    user: {
        findUnique: jest.fn() as jest.MockedFunction<any>,
    },
};

// Mock logger
export const logger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
};

// Custom Error class
export class CustomError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = "CustomError";
    }
}

// API Response
export const ApiResponse = {
    success: (res: any, statusCode: number, message: string, data?: any) => {
        return res.status(statusCode).json({ success: true, message, data });
    },
    error: (res: any, statusCode: number, message: string) => {
        return res.status(statusCode).json({ success: false, message });
    },
};

// Export prisma as the mock
export const prisma = mockPrisma;

// Mock ServiceClients
export const ServiceClients = {
    pdfService: {
        post: jest.fn(),
        get: jest.fn(),
    },
    emailService: {
        post: jest.fn(),
        get: jest.fn(),
    },
    stripeService: {
        post: jest.fn(),
        get: jest.fn(),
    },
};

// Mock createServiceClient
export const createServiceClient = jest.fn();

// Types/Interfaces - re-export common types
export type VatRate = "0%" | "5.5%" | "10%" | "20%";
export type PaymentMethod =
    | "card"
    | "bank_transfer"
    | "check"
    | "cash"
    | "other";
export type InvoiceStatus =
    | "draft"
    | "pending"
    | "sent"
    | "partially_paid"
    | "paid"
    | "overdue"
    | "cancelled";

export interface ICreateInvoiceRequest {
    customer_id: string;
    invoice_date: Date;
    due_date: Date;
    conditions?: string;
    late_payment_penalty?: string;
    items: IInvoiceItemRequest[];
}

export interface IInvoiceItemRequest {
    product_id?: string;
    name: string;
    description?: string;
    quantity: Decimal;
    unit: string;
    unit_price_excluding_tax: Decimal;
    vat_rate: VatRate;
    save_as_product?: boolean;
}

export interface IUpdateInvoiceRequest {
    status?: InvoiceStatus;
    conditions?: string;
    late_payment_penalty?: string;
    items?: IInvoiceItemRequest[];
}

export interface ICreatePaymentRequest {
    amount: Decimal;
    payment_method: PaymentMethod;
    payment_date: Date;
    reference?: string;
    description?: string;
}

export interface IOrganization {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    siret?: string | null;
    tva_intra?: string | null;
    tva_applicable: boolean;
    RCS_number?: string | null;
    RCS_city?: string | null;
    capital?: number | null;
    siren?: string | null;
    legal_form?: string | null;
    address?: string | null;
    postal_code?: string | null;
    city?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    stripe_account_id?: string | null;
    stripe_onboarded: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IUser {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface AuthRequest {
    gatewayUser?: {
        id: string;
        sessionId: string;
        organizationId?: string;
    };
    user?: IUser;
    body: any;
    params: any;
    query: any;
}
