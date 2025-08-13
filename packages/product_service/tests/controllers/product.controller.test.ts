import { ProductController } from '../../src/controllers/product.controller';
import { ProductService } from '../../src/services/product.service';
import { AIProductService } from '../../src/services/ai-product.service';
import { CustomError } from '@zenbilling/shared/src/utils/customError';
import {
  createMockAuthRequest,
  createMockResponse,
  createMockProduct,
  createMockProductRequest,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock services
jest.mock('../../src/services/product.service');
jest.mock('../../src/services/ai-product.service');

const mockProductService = ProductService as any;
const mockAIProductService = AIProductService as any;

describe('ProductController', () => {
  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();
  });

  describe('getAvailableUnits', () => {
    it('should return available units successfully', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUnits = { units: ['unite', 'kg', 'l'] };

      mockProductService.getAvailableUnits.mockReturnValue(mockUnits);

      await ProductController.getAvailableUnits(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Unités récupérées avec succès',
        data: mockUnits,
      });
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const req = createMockAuthRequest({
        body: createMockProductRequest(),
      });
      const res = createMockResponse();
      const mockProduct = createMockProduct();

      mockProductService.createProduct.mockResolvedValue(mockProduct);

      await ProductController.createProduct(req, res);

      expect(mockProductService.createProduct).toHaveBeenCalledWith(
        'test-company-id',
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 401 if no company_id', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        body: createMockProductRequest(),
      });
      const res = createMockResponse();

      await ProductController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle CustomError', async () => {
      const req = createMockAuthRequest({
        body: createMockProductRequest(),
      });
      const res = createMockResponse();

      mockProductService.createProduct.mockRejectedValue(
        new CustomError('Product already exists', 409)
      );

      await ProductController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getProduct', () => {
    it('should get product successfully', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-product-id' },
      });
      const res = createMockResponse();
      const mockProduct = createMockProduct();

      mockProductService.getProduct.mockResolvedValue(mockProduct);

      await ProductController.getProduct(req, res);

      expect(mockProductService.getProduct).toHaveBeenCalledWith(
        'test-product-id',
        'test-company-id'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('AI Methods', () => {
    beforeEach(() => {
      const mockInstance = {
        generateProductDescription: jest.fn(),
        generateProductDescriptionSuggestions: jest.fn(),
        improveProductDescription: jest.fn(),
        generateProductKeywords: jest.fn(),
        isAIServiceAvailable: jest.fn(),
      };

      mockAIProductService.mockImplementation(() => mockInstance);
      (ProductController as any).aiProductService = mockInstance;
    });

    describe('generateProductDescription', () => {
      it('should generate description successfully', async () => {
        const req = createMockAuthRequest({
          body: {
            productName: 'Test Product',
            category: 'Electronics',
          },
        });
        const res = createMockResponse();
        const mockResponse = {
          description: 'Generated description',
          productName: 'Test Product',
          generatedAt: new Date(),
        };

        const aiService = (ProductController as any).aiProductService;
        aiService.generateProductDescription.mockResolvedValue(mockResponse);

        await ProductController.generateProductDescription(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should return 400 if productName is missing', async () => {
        const req = createMockAuthRequest({
          body: {},
        });
        const res = createMockResponse();

        await ProductController.generateProductDescription(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });
  });
});