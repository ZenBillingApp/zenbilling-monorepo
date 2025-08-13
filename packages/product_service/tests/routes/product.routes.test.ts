import request from 'supertest';
import express from 'express';
import productRoutes from '../../src/routes/product.routes';
import { ProductController } from '../../src/controllers/product.controller';

// Mock controller
jest.mock('../../src/controllers/product.controller');

// Mock middleware to pass through
jest.mock('@zenbilling/shared/src/middlewares/auth.middleware', () => ({
  authMiddleware: jest.fn((req: any, res: any, next: any) => {
    req.user = { company_id: 'test-company-id' };
    next();
  }),
}));

jest.mock('@zenbilling/shared/src/middlewares/validation.middleware', () => ({
  validateRequest: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

const mockProductController = ProductController as any;

describe('Product Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/products', productRoutes);

    // Setup mocks
    mockProductController.getAvailableUnits.mockImplementation((req: any, res: any) => {
      return res.status(200).json({ success: true, data: { units: ['unite', 'kg'] } });
    });

    mockProductController.getAvailableVatRates.mockImplementation((req: any, res: any) => {
      return res.status(200).json({ success: true, data: { vatRates: ['ZERO', 'STANDARD'] } });
    });

    mockProductController.createProduct.mockImplementation((req: any, res: any) => {
      return res.status(201).json({ success: true, data: { product_id: 'new-product-id' } });
    });
  });

  describe('GET /products/units', () => {
    it('should get available units', async () => {
      const response = await request(app)
        .get('/products/units')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProductController.getAvailableUnits).toHaveBeenCalled();
    });
  });

  describe('GET /products/vat-rates', () => {
    it('should get available VAT rates', async () => {
      const response = await request(app)
        .get('/products/vat-rates')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProductController.getAvailableVatRates).toHaveBeenCalled();
    });
  });

  describe('POST /products', () => {
    it('should create product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price_excluding_tax: 100,
        vat_rate: 20,
        unit: 'unite',
      };

      const response = await request(app)
        .post('/products')
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockProductController.createProduct).toHaveBeenCalled();
    });
  });
});