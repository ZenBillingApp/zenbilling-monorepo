import { jest } from '@jest/globals';

beforeAll(() => {
    console.log('Configuration des tests globaux pour email service');
    
    // Mock des variables d'environnement
    process.env.BREVO_API_KEY = 'test-api-key-12345';
});

afterAll(() => {
    console.log('Nettoyage final des tests pour email service');
});