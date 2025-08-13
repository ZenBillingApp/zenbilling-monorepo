import { ProductService } from '../../src/services/product.service';
import { CustomError } from '@zenbilling/shared/src/utils/customError';
import {
  createMockProduct,
  createMockProductRequest,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock Prisma before importing anything
jest.mock('@zenbilling/shared/src/libs/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    invoiceItem: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = require('@zenbilling/shared/src/libs/prisma').default;

describe('ProductService', () => {
  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();
  });

  describe('getAvailableUnits', () => {
    it('should return available units', () => {
      const result = ProductService.getAvailableUnits();
      
      expect(result).toHaveProperty('units');
      expect(Array.isArray(result.units)).toBe(true);
      expect(result.units).toContain('unite');
      expect(result.units).toContain('kg');
      expect(result.units).toContain('l');
    });
  });

  describe('getAvailableVatRates', () => {
    it('should return available VAT rates', () => {
      const result = ProductService.getAvailableVatRates();
      
      expect(result).toHaveProperty('vatRates');
      expect(Array.isArray(result.vatRates)).toBe(true);
      expect(result.vatRates).toContain('ZERO');
      expect(result.vatRates).toContain('STANDARD');
      expect(result.vatRates).toContain('REDUCED_1');
    });
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const companyId = 'test-company-id';
      const productData = createMockProductRequest();
      const mockProduct = createMockProduct();
      
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockProduct),
          },
        };
        return await callback(mockTx);
      });

      const result = await ProductService.createProduct(companyId, productData);

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if product name already exists', async () => {
      const companyId = 'test-company-id';
      const productData = createMockProductRequest();
      const existingProduct = createMockProduct();
      
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findFirst: jest.fn().mockResolvedValue(existingProduct),
            create: jest.fn(),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        ProductService.createProduct(companyId, productData)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('getProduct', () => {
    it('should return a product successfully', async () => {
      const productId = 'test-product-id';
      const companyId = 'test-company-id';
      const mockProduct = createMockProduct();
      
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const result = await ProductService.getProduct(productId, companyId);

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          product_id: productId,
          company_id: companyId,
        },
      });
    });

    it('should throw error if product not found', async () => {
      const productId = 'non-existent-id';
      const companyId = 'test-company-id';
      
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(
        ProductService.getProduct(productId, companyId)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('getCompanyProducts', () => {
    it('should return company products with pagination', async () => {
      const companyId = 'test-company-id';
      const mockProducts = [createMockProduct(), createMockProduct()];
      const totalCount = 2;
      
      mockPrisma.$transaction.mockResolvedValue([mockProducts, totalCount]);

      const result = await ProductService.getCompanyProducts(companyId);

      expect(result.products).toEqual(mockProducts);
      expect(result.total).toBe(totalCount);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});