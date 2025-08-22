import { beforeAll, afterAll, beforeEach } from '@jest/globals';

beforeAll(async () => {
    // Configuration globale des tests
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing';
    process.env.BETTER_AUTH_URL = 'http://localhost:3001';
    process.env.CLIENT_URL = 'http://localhost:3000';
});

afterAll(async () => {
    // Nettoyage après tous les tests
});

beforeEach(() => {
    // Nettoyage avant chaque test
    jest.clearAllMocks();
});