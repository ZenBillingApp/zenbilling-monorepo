import { beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals';
import { prismaMock } from './utils/test-helpers';

// Configuration globale pour tous les tests
beforeAll(async () => {
    console.log('Configuration des tests globaux');
});

afterAll(async () => {
    console.log('Nettoyage final des tests');
});

beforeEach(async () => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();
});

afterEach(async () => {
    // Nettoyage après chaque test
});

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3009';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';