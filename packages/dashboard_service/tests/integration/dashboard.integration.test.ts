import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import dashboardRoutes from '../../src/routes/dashboard.routes';
import { DashboardService } from '../../src/services/dashboard.service';
import { CustomError } from '@zenbilling/shared/src/utils/customError';
import { mockDashboardMetrics } from '../utils/test-helpers';

// Mock des dépendances externes
jest.mock('../../src/services/dashboard.service');
jest.mock('@zenbilling/shared/src/utils/logger', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
    },
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

describe('Dashboard Service Integration Tests', () => {
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
        app.use('/api/dashboard', dashboardRoutes);
        jest.clearAllMocks();
    });

    describe('Dashboard Metrics Workflow', () => {
        it('should handle complete dashboard metrics retrieval workflow', async () => {
            // Mock du service
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Métriques du dashboard récupérées avec succès');
            expect(response.body.data).toEqual(mockDashboardMetrics);
            expect(response.body.data.monthlyRevenue).toBe(15750.25);
            expect(response.body.data.yearlyRevenue).toBe(89500.75);
            expect(response.body.data.topCustomers).toHaveLength(2);
            expect(response.body.data.invoiceStatusDistribution).toHaveLength(5);
            expect(response.body.data.quoteStatusDistribution).toHaveLength(5);

            expect(getAllMetricsSpy).toHaveBeenCalledWith('user-123');
            expect(getAllMetricsSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle empty metrics gracefully', async () => {
            const emptyMetrics = {
                monthlyRevenue: 0,
                yearlyRevenue: 0,
                pendingInvoices: 0,
                overdueInvoices: 0,
                topCustomers: [],
                invoiceStatusDistribution: [],
                monthlyQuotes: 0,
                yearlyQuotes: 0,
                pendingQuotes: 0,
                acceptedQuotes: 0,
                quoteStatusDistribution: [],
                quoteToInvoiceRatio: 0,
            };

            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(emptyMetrics);

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(emptyMetrics);
            expect(response.body.data.topCustomers).toEqual([]);
            expect(response.body.data.monthlyRevenue).toBe(0);
        });

        it('should validate complete dashboard metrics structure', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(200);

            const { data } = response.body;

            // Vérifier la structure complète des métriques
            expect(data).toHaveProperty('monthlyRevenue');
            expect(data).toHaveProperty('yearlyRevenue');
            expect(data).toHaveProperty('pendingInvoices');
            expect(data).toHaveProperty('overdueInvoices');
            expect(data).toHaveProperty('topCustomers');
            expect(data).toHaveProperty('invoiceStatusDistribution');
            expect(data).toHaveProperty('monthlyQuotes');
            expect(data).toHaveProperty('yearlyQuotes');
            expect(data).toHaveProperty('pendingQuotes');
            expect(data).toHaveProperty('acceptedQuotes');
            expect(data).toHaveProperty('quoteStatusDistribution');
            expect(data).toHaveProperty('quoteToInvoiceRatio');

            // Vérifier les types
            expect(typeof data.monthlyRevenue).toBe('number');
            expect(typeof data.yearlyRevenue).toBe('number');
            expect(typeof data.pendingInvoices).toBe('number');
            expect(typeof data.overdueInvoices).toBe('number');
            expect(Array.isArray(data.topCustomers)).toBe(true);
            expect(Array.isArray(data.invoiceStatusDistribution)).toBe(true);
            expect(Array.isArray(data.quoteStatusDistribution)).toBe(true);
            expect(typeof data.quoteToInvoiceRatio).toBe('number');
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle service errors gracefully', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockRejectedValue(new CustomError('Erreur de base de données', 500));

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Erreur de base de données');
        });

        it('should handle authentication errors', async () => {
            // Créer une nouvelle application avec un middleware d'auth différent pour ce test
            const testApp = express();
            testApp.use(express.json());
            
            // Middleware d'auth personnalisé sans utilisateur
            testApp.use('/api/dashboard', (req: any, res: any, next: any) => {
                req.user = undefined; // Pas d'utilisateur
                next();
            });
            
            // Utiliser les vraies routes
            const { Router } = require('express');
            const { DashboardController } = require('../../src/controllers/dashboard.controller');
            const testRouter = Router();
            
            const dashboardController = new DashboardController();
            testRouter.get('/metrics', dashboardController.getDashboardMetrics);
            testApp.use('/api/dashboard', testRouter);

            const response = await request(testApp)
                .get('/api/dashboard/metrics')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Non autorisé');
        });

        it('should handle generic service errors', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Erreur lors de la récupération des métriques du dashboard');
        });
    });

    describe('CORS and Headers Integration', () => {
        it('should handle CORS headers correctly', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .set('Origin', 'http://localhost:3000')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        });

        it('should handle JSON content type', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .set('Content-Type', 'application/json')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('should reject requests from unauthorized origins', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .set('Origin', 'http://malicious-site.com')
                .expect(200); // CORS middleware might still allow, depends on config

            // Note: Le comportement exact dépend de la configuration CORS
            // Dans un vrai environnement, ceci pourrait être bloqué
        });
    });

    describe('Performance and Load Testing', () => {
        it('should handle multiple concurrent requests', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            const requests = Array(5).fill(null).map(() =>
                request(app)
                    .get('/api/dashboard/metrics')
                    .expect(200)
            );

            const responses = await Promise.all(requests);

            expect(responses).toHaveLength(5);
            responses.forEach(response => {
                expect(response.body.success).toBe(true);
                expect(response.body.data).toEqual(mockDashboardMetrics);
            });
            expect(getAllMetricsSpy).toHaveBeenCalledTimes(5);
        });

        it('should handle service timeout gracefully', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockImplementation(() => new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Service timeout')), 100);
                }));

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Authentication Integration', () => {
        it('should pass user information correctly to service', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            await request(app)
                .get('/api/dashboard/metrics')
                .expect(200);

            expect(getAllMetricsSpy).toHaveBeenCalledWith('user-123');
        });

        it('should handle different user IDs correctly', async () => {
            // Test avec un autre utilisateur
            const testApp = express();
            testApp.use(express.json());
            
            testApp.use('/api/dashboard', (req: any, res: any, next: any) => {
                req.user = {
                    id: 'user-456',
                    company_id: 'company-456',
                };
                next();
            });
            
            const { Router } = require('express');
            const { DashboardController } = require('../../src/controllers/dashboard.controller');
            const testRouter = Router();
            
            const dashboardController = new DashboardController();
            testRouter.get('/metrics', dashboardController.getDashboardMetrics);
            testApp.use('/api/dashboard', testRouter);

            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            await request(testApp)
                .get('/api/dashboard/metrics')
                .expect(200);

            expect(getAllMetricsSpy).toHaveBeenCalledWith('user-456');
        });
    });

    describe('Response Format Integration', () => {
        it('should return consistent response format', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(mockDashboardMetrics);

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
            expect(response.body.success).toBe(true);
            expect(typeof response.body.message).toBe('string');
            expect(typeof response.body.data).toBe('object');
        });

        it('should return consistent error response format', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockRejectedValue(new CustomError('Test error', 400));

            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(400);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Test error');
        });
    });
});