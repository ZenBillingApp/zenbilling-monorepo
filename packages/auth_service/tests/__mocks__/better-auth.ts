import { jest } from '@jest/globals';

export const betterAuth = jest.fn(() => ({
    api: {
        getSession: jest.fn(),
    },
}));