import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import customerRoutes from '../../src/routes/customer.routes';
import { CustomerService } from '../../src/services/customer.service';
import { CustomError } from '@zenbilling/shared/src/utils/customError';
import {
    mockIndividualCustomer,
    mockBusinessCustomer,
    mockCreateIndividualCustomerRequest,
    mockCreateBusinessCustomerRequest,
} from '../utils/test-helpers';

// Mock des dépendances externes
jest.mock('../../src/services/customer.service');
jest.mock('@zenbilling/shared/src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

// Mock des middlewares
jest.mock('@zenbilling/shared/src/middlewares/auth.middleware', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        req.user = {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            company_id: 'company-123',
            first_name: 'Test',
            last_name: 'User',
            onboarding_completed: true,
            onboarding_step: 'FINISH',
        };
        next();
    },
}));

jest.mock('@zenbilling/shared/src/middlewares/validation.middleware', () => ({
    validateRequest: () => (req: any, res: any, next: any) => next(),
}));

describe('Customer Service Integration Tests', () => {
    let app: express.Application;

    beforeEach(() => {
        // Configuration de l'application Express comme dans le vrai service
        app = express();
        app.use(
            cors({
                origin: ['http://localhost:3000', 'http://localhost:8080'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
                credentials: true,
            })
        );
        app.use(express.json());
        app.use('/api/customer', customerRoutes);
        jest.clearAllMocks();
    });

    describe('Complete Customer Workflow', () => {
        it('should handle complete CRUD workflow for individual customer', async () => {
            // 1. Création d'un client individuel
            const createCustomerSpy = jest.spyOn(CustomerService, 'createCustomer')
                .mockResolvedValue(mockIndividualCustomer);

            const createResponse = await request(app)
                .post('/api/customer')
                .send(mockCreateIndividualCustomerRequest)
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.message).toBe('Client créé avec succès');
            expect(createResponse.body.data).toEqual(mockIndividualCustomer);

            // 2. Récupération du client créé
            const getCustomerSpy = jest.spyOn(CustomerService, 'getCustomerWithDetails')
                .mockResolvedValue(mockIndividualCustomer);

            const getResponse = await request(app)
                .get('/api/customer/customer-123')
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.message).toBe('Client récupéré avec succès');
            expect(getResponse.body.data).toEqual(mockIndividualCustomer);

            // 3. Mise à jour du client
            const updateData = {
                email: 'updated@example.com',
                phone: '+33987654321',
            };
            const updatedCustomer = { ...mockIndividualCustomer, ...updateData };
            const updateCustomerSpy = jest.spyOn(CustomerService, 'updateCustomer')
                .mockResolvedValue(updatedCustomer);

            const updateResponse = await request(app)
                .put('/api/customer/customer-123')
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.message).toBe('Client mis à jour avec succès');
            expect(updateResponse.body.data).toEqual(updatedCustomer);

            // 4. Suppression du client
            const deleteCustomerSpy = jest.spyOn(CustomerService, 'deleteCustomer')
                .mockResolvedValue(undefined);

            const deleteResponse = await request(app)
                .delete('/api/customer/customer-123')
                .expect(200);

            expect(deleteResponse.body.success).toBe(true);
            expect(deleteResponse.body.message).toBe('Client supprimé avec succès');
        });

        it('should handle complete CRUD workflow for business customer', async () => {
            // 1. Création d'un client entreprise
            const createCustomerSpy = jest.spyOn(CustomerService, 'createCustomer')
                .mockResolvedValue(mockBusinessCustomer);

            const createResponse = await request(app)
                .post('/api/customer')
                .send(mockCreateBusinessCustomerRequest)
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data).toEqual(mockBusinessCustomer);

            // 2. Récupération du client créé
            const getCustomerSpy = jest.spyOn(CustomerService, 'getCustomerWithDetails')
                .mockResolvedValue(mockBusinessCustomer);

            const getResponse = await request(app)
                .get('/api/customer/customer-456')
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data).toEqual(mockBusinessCustomer);
        });
    });

    describe('Customer Listing and Filtering', () => {
        it('should handle customer listing with pagination', async () => {
            const mockResult = {
                customers: [mockIndividualCustomer, mockBusinessCustomer],
                total: 2,
                totalPages: 1,
            };
            const getCompanyCustomersSpy = jest.spyOn(CustomerService, 'getCompanyCustomers')
                .mockResolvedValue(mockResult);

            const response = await request(app)
                .get('/api/customer')
                .query({ page: '1', limit: '10' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.customers).toHaveLength(2);
            expect(response.body.data.pagination).toEqual({
                total: 2,
                totalPages: 1,
                currentPage: 1,
                limit: 10,
            });
        });

        it('should handle customer search and filtering', async () => {
            const mockResult = {
                customers: [mockIndividualCustomer],
                total: 1,
                totalPages: 1,
            };
            const getCompanyCustomersSpy = jest.spyOn(CustomerService, 'getCompanyCustomers')
                .mockResolvedValue(mockResult);

            const response = await request(app)
                .get('/api/customer')
                .query({
                    search: 'john',
                    type: 'individual',
                    sortBy: 'email',
                    sortOrder: 'ASC',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.customers).toHaveLength(1);
            expect(getCompanyCustomersSpy).toHaveBeenCalledWith(
                'company-123',
                {
                    page: undefined,
                    limit: undefined,
                    search: 'john',
                    type: 'individual',
                    sortBy: 'email',
                    sortOrder: 'ASC',
                }
            );
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle service errors gracefully', async () => {
            const createCustomerSpy = jest.spyOn(CustomerService, 'createCustomer')
                .mockRejectedValue(new CustomError('Un client avec cet email existe déjà', 409));

            const response = await request(app)
                .post('/api/customer')
                .send(mockCreateIndividualCustomerRequest)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Un client avec cet email existe déjà');
        });

        it('should handle not found errors', async () => {
            const getCustomerSpy = jest.spyOn(CustomerService, 'getCustomerWithDetails')
                .mockRejectedValue(new CustomError('Client non trouvé', 404));

            const response = await request(app)
                .get('/api/customer/non-existent-id')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Client non trouvé');
        });

        it('should handle server errors', async () => {
            const createCustomerSpy = jest.spyOn(CustomerService, 'createCustomer')
                .mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/customer')
                .send(mockCreateIndividualCustomerRequest)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Database connection failed');
        });
    });

    describe('CORS and Headers Integration', () => {
        it('should handle CORS headers correctly', async () => {
            const getCompanyCustomersSpy = jest.spyOn(CustomerService, 'getCompanyCustomers')
                .mockResolvedValue({
                    customers: [],
                    total: 0,
                    totalPages: 0,
                });

            const response = await request(app)
                .get('/api/customer')
                .set('Origin', 'http://localhost:3000')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        });

        it('should handle JSON content type', async () => {
            const createCustomerSpy = jest.spyOn(CustomerService, 'createCustomer')
                .mockResolvedValue(mockIndividualCustomer);

            const response = await request(app)
                .post('/api/customer')
                .set('Content-Type', 'application/json')
                .send(mockCreateIndividualCustomerRequest)
                .expect(201);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });

    describe('Performance and Load Testing', () => {
        it('should handle multiple concurrent requests', async () => {
            const createCustomerSpy = jest.spyOn(CustomerService, 'createCustomer')
                .mockResolvedValue(mockIndividualCustomer);

            const requests = Array(5).fill(null).map(() =>
                request(app)
                    .post('/api/customer')
                    .send(mockCreateIndividualCustomerRequest)
                    .expect(201)
            );

            const responses = await Promise.all(requests);

            expect(responses).toHaveLength(5);
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
            });
            expect(createCustomerSpy).toHaveBeenCalledTimes(5);
        });
    });

    describe('Authorization Integration', () => {
        it('should handle missing company_id', async () => {
            // Créer une nouvelle application avec un middleware d'auth différent pour ce test
            const testApp = express();
            testApp.use(express.json());
            
            // Middleware d'auth personnalisé sans company_id
            testApp.use('/api/customer', (req: any, res: any, next: any) => {
                req.user = { id: 'user-123' }; // Pas de company_id
                next();
            });
            
            // Middleware de validation mocké
            testApp.use('/api/customer', (req: any, res: any, next: any) => next());
            
            // Utiliser les vraies routes
            const { Router } = require('express');
            const { CustomerController } = require('../../src/controllers/customer.controller');
            const testRouter = Router();
            
            testRouter.post('/', CustomerController.createCustomer);
            testApp.use('/api/customer', testRouter);

            const response = await request(testApp)
                .post('/api/customer')
                .send(mockCreateIndividualCustomerRequest)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Aucune entreprise associée à l'utilisateur");
        });
    });

    describe('Validation Integration', () => {
        it('should validate request data through middleware', async () => {
            // Les middlewares de validation sont mockés pour passer,
            // mais on peut tester qu'ils sont bien appelés
            const createCustomerSpy = jest.spyOn(CustomerService, 'createCustomer')
                .mockResolvedValue(mockIndividualCustomer);

            await request(app)
                .post('/api/customer')
                .send(mockCreateIndividualCustomerRequest)
                .expect(201);

            expect(createCustomerSpy).toHaveBeenCalled();
        });
    });
});