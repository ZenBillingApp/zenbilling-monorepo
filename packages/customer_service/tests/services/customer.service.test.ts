import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CustomerService } from '../../src/services/customer.service';
import { CustomError } from '@zenbilling/shared/src/utils/customError';

// Mock de Prisma
jest.mock('@zenbilling/shared/src/libs/prisma', () => ({
    customer: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    $transaction: jest.fn(),
}));

// Mock du logger
jest.mock('@zenbilling/shared/src/utils/logger', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
    },
    info: jest.fn(),
    error: jest.fn(),
}));

const prismaMock = require('@zenbilling/shared/src/libs/prisma');

describe('CustomerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCustomer', () => {
        it('should create a customer successfully', async () => {
            const userId = 'user-123';
            const companyId = 'company-123';
            const customerData = {
                type: 'individual' as const,
                email: 'test@test.com',
                address: '123 Test Street',
                city: 'Test City',
                postal_code: '12345',
                individual: { first_name: 'John', last_name: 'Doe' }
            };
            const mockCustomer = { customer_id: 'customer-123' };

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return await callback(prismaMock);
            });
            prismaMock.customer.findFirst.mockResolvedValue(null);
            prismaMock.customer.create.mockResolvedValue(mockCustomer);

            const result = await CustomerService.createCustomer(userId, companyId, customerData);

            expect(result).toEqual(mockCustomer);
            expect(prismaMock.customer.create).toHaveBeenCalled();
        });

        it('should throw error when email already exists', async () => {
            const userId = 'user-123';
            const companyId = 'company-123';
            const customerData = {
                type: 'individual' as const,
                email: 'test@test.com',
                address: '123 Test Street',
                city: 'Test City',
                postal_code: '12345',
                individual: { first_name: 'John', last_name: 'Doe' }
            };

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return await callback(prismaMock);
            });
            prismaMock.customer.findFirst.mockResolvedValue({ customer_id: 'existing' });

            await expect(
                CustomerService.createCustomer(userId, companyId, customerData)
            ).rejects.toThrow('Un client avec cet email existe déjà dans votre entreprise');
        });
    });

    describe('updateCustomer', () => {
        it('should update a customer successfully', async () => {
            const customerId = 'customer-123';
            const companyId = 'company-123';
            const updateData = { email: 'updated@test.com' };
            const mockCustomer = { customer_id: customerId };

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return await callback(prismaMock);
            });
            prismaMock.customer.findFirst
                .mockResolvedValueOnce(mockCustomer) // Trouve le client existant
                .mockResolvedValueOnce(null); // Pas de conflit d'email
            prismaMock.customer.update.mockResolvedValue(mockCustomer);

            const result = await CustomerService.updateCustomer(customerId, companyId, updateData);

            expect(result).toEqual(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            const customerId = 'customer-123';
            const companyId = 'company-123';
            const updateData = { email: 'updated@test.com' };

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return await callback(prismaMock);
            });
            prismaMock.customer.findFirst.mockResolvedValue(null);

            await expect(
                CustomerService.updateCustomer(customerId, companyId, updateData)
            ).rejects.toThrow('Client non trouvé');
        });
    });

    describe('deleteCustomer', () => {
        it('should delete a customer successfully', async () => {
            const customerId = 'customer-123';
            const companyId = 'company-123';

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return await callback(prismaMock);
            });
            prismaMock.customer.findFirst.mockResolvedValue({ customer_id: customerId });
            prismaMock.customer.delete.mockResolvedValue(undefined);

            await CustomerService.deleteCustomer(customerId, companyId);

            expect(prismaMock.customer.delete).toHaveBeenCalledWith({
                where: { customer_id: customerId },
            });
        });

        it('should throw error when customer not found', async () => {
            const customerId = 'customer-123';
            const companyId = 'company-123';

            prismaMock.$transaction.mockImplementation(async (callback: any) => {
                return await callback(prismaMock);
            });
            prismaMock.customer.findFirst.mockResolvedValue(null);

            await expect(
                CustomerService.deleteCustomer(customerId, companyId)
            ).rejects.toThrow('Client non trouvé');
        });
    });

    describe('getCustomerWithDetails', () => {
        it('should get a customer with details successfully', async () => {
            const customerId = 'customer-123';
            const companyId = 'company-123';
            const mockCustomer = { customer_id: customerId };

            prismaMock.customer.findFirst.mockResolvedValue(mockCustomer);

            const result = await CustomerService.getCustomerWithDetails(customerId, companyId);

            expect(result).toEqual(mockCustomer);
        });

        it('should throw error when customer not found', async () => {
            const customerId = 'customer-123';
            const companyId = 'company-123';

            prismaMock.customer.findFirst.mockResolvedValue(null);

            await expect(
                CustomerService.getCustomerWithDetails(customerId, companyId)
            ).rejects.toThrow('Client non trouvé');
        });
    });

    describe('getCompanyCustomers', () => {
        it('should get company customers with default parameters', async () => {
            const companyId = 'company-123';
            const mockCustomers = [{ customer_id: '1' }, { customer_id: '2' }];

            prismaMock.customer.findMany.mockResolvedValue(mockCustomers);
            prismaMock.customer.count.mockResolvedValue(2);

            const result = await CustomerService.getCompanyCustomers(companyId);

            expect(result).toEqual({
                customers: mockCustomers,
                total: 2,
                totalPages: 1,
            });
        });

        it('should handle database error', async () => {
            const companyId = 'company-123';
            const dbError = new Error('Database connection failed');

            prismaMock.customer.findMany.mockRejectedValue(dbError);

            await expect(
                CustomerService.getCompanyCustomers(companyId)
            ).rejects.toThrow('Erreur lors de la récupération des clients');
        });
    });
});