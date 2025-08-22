import { jest } from '@jest/globals';

// Mock du module Prisma
export const mockPrisma = {
    user: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((callback: any) => callback(mockPrisma)),
};

// Mock de Better Auth
export const mockAuth = {
    api: {
        getSession: jest.fn(),
    },
};

// Mock user data
export const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    company_id: 'test-company-id',
    onboarding_completed: false,
    onboarding_step: 'CHOOSING_COMPANY',
    stripe_onboarded: false,
    stripe_account_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

// Mock session data
export const mockSession = {
    user: {
        id: 'test-user-id',
        email: 'test@example.com',
    },
    session: {
        id: 'test-session-id',
    },
};

// Helper pour réinitialiser les mocks
export const resetMocks = () => {
    Object.values(mockPrisma.user).forEach(mock => {
        if (typeof mock === 'function' && 'mockReset' in mock) {
            (mock as any).mockReset();
        }
    });
    if ('mockReset' in mockPrisma.$transaction) {
        (mockPrisma.$transaction as any).mockReset();
        (mockPrisma.$transaction as any).mockImplementation((callback: any) => callback(mockPrisma));
    }
    if ('mockReset' in mockAuth.api.getSession) {
        (mockAuth.api.getSession as any).mockReset();
    }
};