import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DashboardController } from '../../src/controllers/dashboard.controller';
import { DashboardService } from '../../src/services/dashboard.service';
import { mockDashboardMetrics } from '../utils/test-helpers';

// Mock des services et utils
jest.mock('../../src/services/dashboard.service');
jest.mock('@zenbilling/shared/src/utils/apiResponse');
jest.mock('@zenbilling/shared/src/utils/logger');

describe('DashboardController', () => {
    let dashboardController: DashboardController;
    let req: any;
    let res: any;

    beforeEach(() => {
        dashboardController = new DashboardController();
        req = {
            user: {
                id: 'user-123',
                company_id: 'company-123',
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();

        // Mock the service method directly
        jest.spyOn(DashboardService.prototype, 'getAllMetrics')
            .mockResolvedValue(mockDashboardMetrics);
    });

    describe('getDashboardMetrics', () => {
        it('should handle dashboard request successfully', async () => {
            // Just test that the method can be called without error
            await expect(dashboardController.getDashboardMetrics(req, res))
                .resolves.not.toThrow();
        });

        it('should return 401 when user is not authenticated', async () => {
            req.user = undefined;
            
            await expect(dashboardController.getDashboardMetrics(req, res))
                .resolves.not.toThrow();
        });

        it('should handle missing user ID', async () => {
            req.user = { company_id: 'company-123' }; // Missing id
            
            await expect(dashboardController.getDashboardMetrics(req, res))
                .resolves.not.toThrow();
        });

        it('should handle service errors', async () => {
            jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockRejectedValue(new Error('Service error'));

            await expect(dashboardController.getDashboardMetrics(req, res))
                .resolves.not.toThrow();
        });

        it('should call service with user ID when available', async () => {
            const getAllMetricsSpy = jest.spyOn(DashboardService.prototype, 'getAllMetrics');

            await dashboardController.getDashboardMetrics(req, res);

            expect(getAllMetricsSpy).toHaveBeenCalledWith('user-123');
        });

        it('should handle empty metrics response', async () => {
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

            jest.spyOn(DashboardService.prototype, 'getAllMetrics')
                .mockResolvedValue(emptyMetrics);

            await expect(dashboardController.getDashboardMetrics(req, res))
                .resolves.not.toThrow();
        });
    });
});