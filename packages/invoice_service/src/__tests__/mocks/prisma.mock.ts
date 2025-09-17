import { jest } from "@jest/globals";

// Mock de Prisma Client
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

// Mock du module Prisma
jest.mock("@zenbilling/shared", () => {
    const actual = jest.requireActual("@zenbilling/shared") as any;
    return {
        ...actual,
        prisma: mockPrisma,
        logger: {
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
        },
    };
});

export default mockPrisma;
