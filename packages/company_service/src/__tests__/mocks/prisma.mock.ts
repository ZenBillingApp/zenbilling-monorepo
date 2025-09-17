import { jest } from "@jest/globals";

export const mockPrisma = {
    company: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
};

// Mock the Prisma module
jest.unstable_mockModule("@zenbilling/shared", () => ({
    prisma: mockPrisma,
    CustomError: class CustomError extends Error {
        constructor(message: string, public statusCode: number) {
            super(message);
            this.name = "CustomError";
        }
    },
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
    ApiResponse: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));