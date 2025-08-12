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
}

// Mock des modules externes
jest.mock("@zenbilling/shared/src/libs/prisma", () => ({
    __esModule: true,
    default: {
        company: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
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

// Mock de la configuration de l'environnement
process.env.NODE_ENV = "test";
process.env.PORT = "3002";
