import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import customerRoutes from '../../src/routes/customer.routes';
import { CustomerController } from '../../src/controllers/customer.controller';

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

// Mock du contrôleur
jest.mock('../../src/controllers/customer.controller', () => ({
    CustomerController: {
        createCustomer: jest.fn(),
        getCustomer: jest.fn(),
        updateCustomer: jest.fn(),
        deleteCustomer: jest.fn(),
        getCompanyCustomers: jest.fn(),
    },
}));

describe('Customer Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/customer', customerRoutes);
        jest.clearAllMocks();
    });

    describe('POST /api/customer', () => {
        it('should call CustomerController.createCustomer', async () => {
            (CustomerController.createCustomer as any).mockImplementation(async (req: any, res: any) => {
                return res.status(201).json({ success: true, message: 'Client créé avec succès' });
            });

            const customerData = {
                type: 'individual',
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

            const response = await request(app)
                .post('/api/customer')
                .send(customerData)
                .expect(201);

            expect(CustomerController.createCustomer).toHaveBeenCalled();
            expect(response.body).toEqual({
                success: true,
                message: 'Client créé avec succès',
            });
        });
    });

    describe('GET /api/customer', () => {
        it('should call CustomerController.getCompanyCustomers', async () => {
            (CustomerController.getCompanyCustomers as any).mockImplementation(async (req: any, res: any) => {
                return res.status(200).json({
                    success: true,
                    message: 'Clients récupérés avec succès',
                    data: {
                        customers: [],
                        pagination: {
                            total: 0,
                            totalPages: 0,
                            currentPage: 1,
                            limit: 10,
                        },
                    },
                });
            });

            const response = await request(app)
                .get('/api/customer')
                .expect(200);

            expect(CustomerController.getCompanyCustomers).toHaveBeenCalled();
            expect(response.body.success).toBe(true);
        });

        it('should pass query parameters to controller', async () => {
            (CustomerController.getCompanyCustomers as any).mockImplementation(async (req: any, res: any) => {
                return res.status(200).json({ success: true });
            });

            await request(app)
                .get('/api/customer')
                .query({
                    page: '2',
                    limit: '5',
                    search: 'john',
                    type: 'individual',
                    sortBy: 'email',
                    sortOrder: 'ASC',
                })
                .expect(200);

            expect(CustomerController.getCompanyCustomers).toHaveBeenCalled();
        });
    });

    describe('GET /api/customer/:id', () => {
        it('should call CustomerController.getCustomer', async () => {
            (CustomerController.getCustomer as any).mockImplementation(async (req: any, res: any) => {
                return res.status(200).json({
                    success: true,
                    message: 'Client récupéré avec succès',
                    data: { customer_id: req.params.id },
                });
            });

            const response = await request(app)
                .get('/api/customer/customer-123')
                .expect(200);

            expect(CustomerController.getCustomer).toHaveBeenCalled();
            expect(response.body.success).toBe(true);
            expect(response.body.data.customer_id).toBe('customer-123');
        });
    });

    describe('PUT /api/customer/:id', () => {
        it('should call CustomerController.updateCustomer', async () => {
            (CustomerController.updateCustomer as any).mockImplementation(async (req: any, res: any) => {
                return res.status(200).json({
                    success: true,
                    message: 'Client mis à jour avec succès',
                });
            });

            const updateData = {
                email: 'updated@example.com',
                phone: '+33987654321',
            };

            const response = await request(app)
                .put('/api/customer/customer-123')
                .send(updateData)
                .expect(200);

            expect(CustomerController.updateCustomer).toHaveBeenCalled();
            expect(response.body.success).toBe(true);
        });
    });

    describe('DELETE /api/customer/:id', () => {
        it('should call CustomerController.deleteCustomer', async () => {
            (CustomerController.deleteCustomer as any).mockImplementation(async (req: any, res: any) => {
                return res.status(200).json({
                    success: true,
                    message: 'Client supprimé avec succès',
                });
            });

            const response = await request(app)
                .delete('/api/customer/customer-123')
                .expect(200);

            expect(CustomerController.deleteCustomer).toHaveBeenCalled();
            expect(response.body.success).toBe(true);
        });
    });

    describe('Authentication middleware', () => {
        it('should add user to request object', async () => {
            (CustomerController.getCompanyCustomers as any).mockImplementation(async (req: any, res: any) => {
                return res.status(200).json({ user: req.user });
            });

            const response = await request(app)
                .get('/api/customer')
                .expect(200);

            expect(response.body.user).toEqual({
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                company_id: 'company-123',
                first_name: 'Test',
                last_name: 'User',
                onboarding_completed: true,
                onboarding_step: 'FINISH',
            });
        });
    });

    describe('Route parameter validation', () => {
        it('should handle invalid route parameters gracefully', async () => {
            (CustomerController.getCustomer as any).mockImplementation(async (req: any, res: any) => {
                return res.status(400).json({
                    success: false,
                    message: 'ID invalide',
                });
            });

            await request(app)
                .get('/api/customer/invalid-id')
                .expect(400);

            expect(CustomerController.getCustomer).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should handle controller errors', async () => {
            (CustomerController.createCustomer as any).mockImplementation(async (req: any, res: any) => {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur interne du serveur',
                });
            });

            const customerData = {
                type: 'individual',
                email: 'john.doe@example.com',
            };

            await request(app)
                .post('/api/customer')
                .send(customerData)
                .expect(500);

            expect(CustomerController.createCustomer).toHaveBeenCalled();
        });
    });
});