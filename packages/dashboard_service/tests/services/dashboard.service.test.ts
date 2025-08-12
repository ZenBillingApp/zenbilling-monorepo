import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DashboardService } from '../../src/services/dashboard.service';
import { InvoiceStatus, QuoteStatus } from '@prisma/client';
import {
    mockRevenueAggregate,
    mockYearlyRevenueAggregate,
    mockInvoiceGroupBy,
    mockQuoteGroupBy,
    mockCustomersWithStats,
    mockDate,
    restoreDate,
} from '../utils/test-helpers';

// Mock de Prisma
jest.mock('@zenbilling/shared/src/libs/prisma', () => ({
    invoice: {
        aggregate: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    quote: {
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    customer: {
        findMany: jest.fn(),
    },
}));

// Mock de date-fns
jest.mock('date-fns', () => ({
    startOfMonth: jest.fn(),
    endOfMonth: jest.fn(),
    startOfYear: jest.fn(),
    endOfYear: jest.fn(),
}));

const prismaMock = require('@zenbilling/shared/src/libs/prisma');
const dateFnsMock = require('date-fns');

describe('DashboardService', () => {
    let dashboardService: DashboardService;
    const userId = 'user-123';
    const testDate = '2024-01-15T10:00:00Z';

    beforeEach(() => {
        dashboardService = new DashboardService();
        jest.clearAllMocks();
        
        // Mock des dates
        mockDate(testDate);
        dateFnsMock.startOfMonth.mockReturnValue(new Date('2024-01-01T00:00:00Z'));
        dateFnsMock.endOfMonth.mockReturnValue(new Date('2024-01-31T23:59:59Z'));
        dateFnsMock.startOfYear.mockReturnValue(new Date('2024-01-01T00:00:00Z'));
        dateFnsMock.endOfYear.mockReturnValue(new Date('2024-12-31T23:59:59Z'));
    });

    afterEach(() => {
        restoreDate();
    });

    describe('getMonthlyRevenue', () => {
        it('should return monthly revenue for paid invoices', async () => {
            prismaMock.invoice.aggregate.mockResolvedValue(mockRevenueAggregate);

            const result = await dashboardService.getMonthlyRevenue(userId);

            expect(result).toBe(15750.25);
            expect(prismaMock.invoice.aggregate).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    invoice_date: {
                        gte: new Date('2024-01-01T00:00:00Z'),
                        lte: new Date('2024-01-31T23:59:59Z'),
                    },
                    status: InvoiceStatus.paid,
                },
                _sum: {
                    amount_including_tax: true,
                },
            });
        });

        it('should return 0 when no revenue found', async () => {
            prismaMock.invoice.aggregate.mockResolvedValue({ _sum: { amount_including_tax: null } });

            const result = await dashboardService.getMonthlyRevenue(userId);

            expect(result).toBe(0);
        });
    });

    describe('getYearlyRevenue', () => {
        it('should return yearly revenue for paid invoices', async () => {
            prismaMock.invoice.aggregate.mockResolvedValue(mockYearlyRevenueAggregate);

            const result = await dashboardService.getYearlyRevenue(userId);

            expect(result).toBe(89500.75);
            expect(prismaMock.invoice.aggregate).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    invoice_date: {
                        gte: new Date('2024-01-01T00:00:00Z'),
                        lte: new Date('2024-12-31T23:59:59Z'),
                    },
                    status: InvoiceStatus.paid,
                },
                _sum: {
                    amount_including_tax: true,
                },
            });
        });
    });

    describe('getPendingInvoices', () => {
        it('should return count of pending invoices', async () => {
            prismaMock.invoice.count.mockResolvedValue(5);

            const result = await dashboardService.getPendingInvoices(userId);

            expect(result).toBe(5);
            expect(prismaMock.invoice.count).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    status: InvoiceStatus.pending,
                },
            });
        });
    });

    describe('getOverdueInvoices', () => {
        it('should return count of overdue invoices', async () => {
            prismaMock.invoice.count.mockResolvedValue(2);

            const result = await dashboardService.getOverdueInvoices(userId);

            expect(result).toBe(2);
            expect(prismaMock.invoice.count).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    status: InvoiceStatus.late,
                },
            });
        });
    });

    describe('getTopCustomers', () => {
        it('should return top customers with default limit', async () => {
            prismaMock.customer.findMany.mockResolvedValue(mockCustomersWithStats);

            const result = await dashboardService.getTopCustomers(userId);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                customer_id: 'customer-1',
                name: 'ACME Corp',
                type: 'company',
                _count: {
                    invoices: 15,
                    quotes: 8,
                },
                invoices: [
                    { amount_including_tax: 1200.5 },
                    { amount_including_tax: 800.25 },
                ],
                quotes: [
                    { amount_including_tax: 1500 },
                ],
            });
            expect(result[1]).toEqual({
                customer_id: 'customer-2',
                name: 'John Doe',
                type: 'individual',
                _count: {
                    invoices: 10,
                    quotes: 5,
                },
                invoices: [
                    { amount_including_tax: 950.75 },
                ],
                quotes: [
                    { amount_including_tax: 750 },
                ],
            });
        });

        it('should return top customers with custom limit', async () => {
            prismaMock.customer.findMany.mockResolvedValue([mockCustomersWithStats[0]]);

            const result = await dashboardService.getTopCustomers(userId, 1);

            expect(result).toHaveLength(1);
            expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 1,
                })
            );
        });

        it('should handle customers with empty names', async () => {
            const customersWithEmptyNames = [
                {
                    ...mockCustomersWithStats[0],
                    business: null,
                    individual: null,
                },
            ];
            prismaMock.customer.findMany.mockResolvedValue(customersWithEmptyNames);

            const result = await dashboardService.getTopCustomers(userId);

            expect(result[0].name).toBe('');
        });
    });

    describe('getInvoiceStatusDistribution', () => {
        it('should return invoice status distribution', async () => {
            prismaMock.invoice.groupBy.mockResolvedValue(mockInvoiceGroupBy);

            const result = await dashboardService.getInvoiceStatusDistribution(userId);

            expect(result).toHaveLength(5);
            expect(result).toEqual([
                { status: InvoiceStatus.pending, _count: 5 },
                { status: InvoiceStatus.sent, _count: 3 },
                { status: InvoiceStatus.paid, _count: 12 },
                { status: InvoiceStatus.cancelled, _count: 1 },
                { status: InvoiceStatus.late, _count: 2 },
            ]);
        });

        it('should handle empty distribution', async () => {
            prismaMock.invoice.groupBy.mockResolvedValue([]);

            const result = await dashboardService.getInvoiceStatusDistribution(userId);

            expect(result).toHaveLength(5);
            expect(result.every(item => item._count === 0)).toBe(true);
        });
    });

    describe('getMonthlyQuotes', () => {
        it('should return monthly quotes count', async () => {
            prismaMock.quote.count.mockResolvedValue(12);

            const result = await dashboardService.getMonthlyQuotes(userId);

            expect(result).toBe(12);
            expect(prismaMock.quote.count).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    quote_date: {
                        gte: new Date('2024-01-01T00:00:00Z'),
                        lte: new Date('2024-01-31T23:59:59Z'),
                    },
                },
            });
        });
    });

    describe('getYearlyQuotes', () => {
        it('should return yearly quotes count', async () => {
            prismaMock.quote.count.mockResolvedValue(45);

            const result = await dashboardService.getYearlyQuotes(userId);

            expect(result).toBe(45);
        });
    });

    describe('getPendingQuotes', () => {
        it('should return pending quotes count', async () => {
            prismaMock.quote.count.mockResolvedValue(4);

            const result = await dashboardService.getPendingQuotes(userId);

            expect(result).toBe(4);
            expect(prismaMock.quote.count).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    status: QuoteStatus.sent,
                },
            });
        });
    });

    describe('getAcceptedQuotes', () => {
        it('should return accepted quotes count', async () => {
            prismaMock.quote.count.mockResolvedValue(8);

            const result = await dashboardService.getAcceptedQuotes(userId);

            expect(result).toBe(8);
            expect(prismaMock.quote.count).toHaveBeenCalledWith({
                where: {
                    user_id: userId,
                    status: QuoteStatus.accepted,
                },
            });
        });
    });

    describe('getQuoteStatusDistribution', () => {
        it('should return quote status distribution', async () => {
            prismaMock.quote.groupBy.mockResolvedValue(mockQuoteGroupBy);

            const result = await dashboardService.getQuoteStatusDistribution(userId);

            expect(result).toHaveLength(5);
            expect(result).toEqual([
                { status: QuoteStatus.draft, _count: 2 },
                { status: QuoteStatus.sent, _count: 4 },
                { status: QuoteStatus.accepted, _count: 8 },
                { status: QuoteStatus.rejected, _count: 3 },
                { status: QuoteStatus.expired, _count: 1 },
            ]);
        });
    });

    describe('getQuoteToInvoiceRatio', () => {
        it('should calculate quote to invoice ratio', async () => {
            prismaMock.quote.count.mockResolvedValueOnce(8); // accepted quotes
            prismaMock.invoice.count.mockResolvedValueOnce(12); // paid invoices

            const result = await dashboardService.getQuoteToInvoiceRatio(userId);

            expect(result).toBe(0.67);
        });

        it('should return 0 when no invoices', async () => {
            prismaMock.quote.count.mockResolvedValueOnce(8);
            prismaMock.invoice.count.mockResolvedValueOnce(0);

            const result = await dashboardService.getQuoteToInvoiceRatio(userId);

            expect(result).toBe(0);
        });
    });

    describe('getAllMetrics', () => {
        it('should return all dashboard metrics', async () => {
            // Mock all the individual methods
            prismaMock.invoice.aggregate
                .mockResolvedValueOnce(mockRevenueAggregate) // monthly revenue
                .mockResolvedValueOnce(mockYearlyRevenueAggregate); // yearly revenue
            
            prismaMock.invoice.count
                .mockResolvedValueOnce(5) // pending invoices
                .mockResolvedValueOnce(2) // overdue invoices
                .mockResolvedValueOnce(12); // paid invoices for ratio
            
            prismaMock.customer.findMany.mockResolvedValue(mockCustomersWithStats);
            prismaMock.invoice.groupBy.mockResolvedValue(mockInvoiceGroupBy);
            
            prismaMock.quote.count
                .mockResolvedValueOnce(12) // monthly quotes
                .mockResolvedValueOnce(45) // yearly quotes
                .mockResolvedValueOnce(4) // pending quotes
                .mockResolvedValueOnce(8) // accepted quotes
                .mockResolvedValueOnce(8); // accepted quotes for ratio
            
            prismaMock.quote.groupBy.mockResolvedValue(mockQuoteGroupBy);

            const result = await dashboardService.getAllMetrics(userId);

            expect(result).toEqual({
                monthlyRevenue: 15750.25,
                yearlyRevenue: 89500.75,
                pendingInvoices: 5,
                overdueInvoices: 2,
                topCustomers: [
                    {
                        customer_id: 'customer-1',
                        name: 'ACME Corp',
                        type: 'company',
                        _count: { invoices: 15, quotes: 8 },
                        invoices: [{ amount_including_tax: 1200.5 }, { amount_including_tax: 800.25 }],
                        quotes: [{ amount_including_tax: 1500 }],
                    },
                    {
                        customer_id: 'customer-2',
                        name: 'John Doe',
                        type: 'individual',
                        _count: { invoices: 10, quotes: 5 },
                        invoices: [{ amount_including_tax: 950.75 }],
                        quotes: [{ amount_including_tax: 750 }],
                    },
                ],
                invoiceStatusDistribution: mockInvoiceGroupBy,
                monthlyQuotes: 12,
                yearlyQuotes: 45,
                pendingQuotes: 4,
                acceptedQuotes: 8,
                quoteStatusDistribution: mockQuoteGroupBy,
                quoteToInvoiceRatio: 0.67,
            });
        });

        it('should handle errors in getAllMetrics', async () => {
            prismaMock.invoice.aggregate.mockRejectedValue(new Error('Database error'));

            await expect(dashboardService.getAllMetrics(userId)).rejects.toThrow('Database error');
        });
    });
});