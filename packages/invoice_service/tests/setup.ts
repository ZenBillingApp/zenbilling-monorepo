import { jest } from "@jest/globals";

// Mock de Decimal
class MockDecimal {
    constructor(public value: number | string) {}

    toString() {
        return this.value.toString();
    }

    toNumber() {
        return typeof this.value === "string"
            ? parseFloat(this.value)
            : this.value;
    }

    valueOf() {
        return this.toNumber();
    }

    toJSON() {
        return this.toNumber();
    }

    toFixed(decimals?: number) {
        return this.toNumber().toFixed(decimals);
    }

    plus(other: any) {
        return new MockDecimal(this.toNumber() + (typeof other === 'object' ? other.toNumber() : Number(other)));
    }

    times(other: any) {
        return new MockDecimal(this.toNumber() * (typeof other === 'object' ? other.toNumber() : Number(other)));
    }

    div(other: any) {
        return new MockDecimal(this.toNumber() / (typeof other === 'object' ? other.toNumber() : Number(other)));
    }
}

// Mock des modules externes
jest.mock("@zenbilling/shared/src/libs/prisma", () => ({
    __esModule: true,
    default: {
        invoice: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
            aggregate: jest.fn(),
        },
        payment: {
            create: jest.fn(),
            findMany: jest.fn(),
            aggregate: jest.fn(),
        },
        product: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        customer: {
            findUnique: jest.fn(),
        },
        company: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn(),
    },
    Decimal: MockDecimal,
}));

jest.mock("@zenbilling/shared/src/utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock("axios", () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

// Mock de la configuration de l'environnement
process.env.NODE_ENV = "test";
process.env.PORT = "3005";
process.env.PDF_SERVICE_URL = "http://localhost:3010";
process.env.EMAIL_SERVICE_URL = "http://localhost:3007";
process.env.STRIPE_SERVICE_URL = "http://localhost:3003";