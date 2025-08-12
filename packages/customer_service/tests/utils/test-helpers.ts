import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { ICustomer } from '@zenbilling/shared/src/interfaces/Customer.interface';

// Mock de Prisma
export const prismaMock = mockDeep<PrismaClient>();

// Mock de l'utilisateur pour les tests
export const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    company_id: 'company-123',
    first_name: 'Test',
    last_name: 'User',
    onboarding_completed: true,
    onboarding_step: 'FINISH' as const,
};

// Mock de la requête avec utilisateur authentifié
export const mockAuthRequest = {
    user: mockUser,
    body: {},
    params: {},
    query: {},
};

// Mock de la réponse
export const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Données de test pour les clients
export const mockIndividualCustomer: ICustomer = {
    customer_id: 'customer-123',
    user_id: 'user-123',
    company_id: 'company-123',
    type: 'individual',
    email: 'john.doe@example.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    createdAt: '2024-01-01T00:00:00.000Z' as any,
    updatedAt: '2024-01-01T00:00:00.000Z' as any,
    individual: {
        customer_id: 'customer-123',
        first_name: 'John',
        last_name: 'Doe',
    },
    business: null,
};

export const mockBusinessCustomer: ICustomer = {
    customer_id: 'customer-456',
    user_id: 'user-123',
    company_id: 'company-123',
    type: 'company',
    email: 'contact@acme.com',
    phone: '+33123456789',
    address: '456 Avenue des Champs',
    city: 'Lyon',
    postal_code: '69001',
    country: 'France',
    createdAt: '2024-01-01T00:00:00.000Z' as any,
    updatedAt: '2024-01-01T00:00:00.000Z' as any,
    individual: null,
    business: {
        customer_id: 'customer-456',
        name: 'ACME Corporation',
        siret: '12345678901234',
        siren: '123456789',
        tva_intra: 'FR12123456789',
        tva_applicable: true,
    },
};

// Données de test pour la création d'un client individuel
export const mockCreateIndividualCustomerRequest = {
    type: 'individual' as const,
    email: 'john.doe@example.com',
    phone: '+33123456789',
    address: '123 Rue de la Paix',
    city: 'Paris',
    postal_code: '75001',
    country: 'France',
    individual: {
        first_name: 'John',
        last_name: 'Doe',
    },
};

// Données de test pour la création d'un client entreprise
export const mockCreateBusinessCustomerRequest = {
    type: 'company' as const,
    email: 'contact@acme.com',
    phone: '+33123456789',
    address: '456 Avenue des Champs',
    city: 'Lyon',
    postal_code: '69001',
    country: 'France',
    business: {
        name: 'ACME Corporation',
        siret: '12345678901234',
        siren: '123456789',
        tva_intra: 'FR12123456789',
        tva_applicable: true,
    },
};

// Fonction utilitaire pour réinitialiser les mocks
export const resetMocks = () => {
    mockReset(prismaMock);
};

// Fonction utilitaire pour créer une erreur Prisma
export const createPrismaError = (code: string, message: string) => {
    const error = new Error(message) as any;
    error.code = code;
    return error;
};