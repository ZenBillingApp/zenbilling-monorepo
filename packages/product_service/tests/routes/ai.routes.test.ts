import request from 'supertest';
import express from 'express';
import aiRoutes from '../../src/routes/ai.routes';
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

jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

const mockProductController = ProductController as any;

describe('AI Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/products', aiRoutes);

    mockProductController.generateProductDescription.mockImplementation((req: any, res: any) => {
      return res.status(200).json({
        success: true,
        data: { description: 'Generated description' },
      });
    });

    mockProductController.checkAIService.mockImplementation((req: any, res: any) => {
      return res.status(200).json({
        success: true,
        data: { aiServiceAvailable: true },
      });
    });
  });

  describe('POST /products/ai/generate-description', () => {
    it('should generate description', async () => {
      const requestData = {
        productName: 'Test Product',
        category: 'Electronics',
      };

      const response = await request(app)
        .post('/products/ai/generate-description')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProductController.generateProductDescription).toHaveBeenCalled();
    });
  });

  describe('GET /products/ai/status', () => {
    it('should check AI service status', async () => {
      const response = await request(app)
        .get('/products/ai/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockProductController.checkAIService).toHaveBeenCalled();
    });
  });
});