import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import dashboardRoutes from '../../src/routes/dashboard.routes';

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

// Mock du contrôleur avec des implémentations simplifiées
jest.mock('../../src/controllers/dashboard.controller', () => ({
    DashboardController: jest.fn().mockImplementation(() => ({
        getDashboardMetrics: jest.fn().mockImplementation(async (req: any, res: any) => {
            return res.status(200).json({
                success: true,
                message: 'Métriques du dashboard récupérées avec succès',
                data: {
                    monthlyRevenue: 15750.25,
                    yearlyRevenue: 89500.75,
                    pendingInvoices: 5,
                    overdueInvoices: 2,
                },
            });
        }),
    })),
}));

describe('Dashboard Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/dashboard', dashboardRoutes);
        jest.clearAllMocks();
    });

    describe('GET /api/dashboard/metrics', () => {
        it('should call dashboard metrics endpoint successfully', async () => {
            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Métriques du dashboard récupérées avec succès',
                data: {
                    monthlyRevenue: 15750.25,
                    yearlyRevenue: 89500.75,
                    pendingInvoices: 5,
                    overdueInvoices: 2,
                },
            });
        });

        it('should return 404 for non-existent routes', async () => {
            await request(app)
                .get('/api/dashboard/non-existent')
                .expect(404);
        });

        it('should only accept GET requests on /metrics', async () => {
            // Test POST request should fail
            await request(app)
                .post('/api/dashboard/metrics')
                .expect(404);

            // Test PUT request should fail  
            await request(app)
                .put('/api/dashboard/metrics')
                .expect(404);

            // Test DELETE request should fail
            await request(app)
                .delete('/api/dashboard/metrics')
                .expect(404);
        });

        it('should handle authentication middleware', async () => {
            const response = await request(app)
                .get('/api/dashboard/metrics')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});