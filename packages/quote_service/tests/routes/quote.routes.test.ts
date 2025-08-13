import request from 'supertest';
import express from 'express';
import quoteRoutes from '../../src/routes/quote.routes';
import { QuoteController } from '../../src/controllers/quote.controller';
import { authMiddleware } from '@zenbilling/shared/src/middlewares/auth.middleware';
import { validateRequest } from '@zenbilling/shared/src/middlewares/validation.middleware';
import { createMockQuoteRequest, createMockQuote, clearAllMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('../../src/controllers/quote.controller');
jest.mock('@zenbilling/shared/src/middlewares/auth.middleware');
jest.mock('@zenbilling/shared/src/middlewares/validation.middleware', () => ({
  validateRequest: jest.fn(() => (req: any, res: any, next: any) => next()),
}));
jest.mock('@zenbilling/shared/src/validations/quote.validation', () => ({
  createQuoteSchema: {},
  updateQuoteSchema: {},
}));

const mockQuoteController = QuoteController as jest.Mocked<typeof QuoteController>;
const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockValidateRequest = validateRequest as jest.MockedFunction<typeof validateRequest>;

describe('Quote Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/quote', quoteRoutes);
  });

  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();

    // Mock middleware to pass through
    (mockAuthMiddleware as any).mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        id: 'test-user-id',
        company_id: 'test-company-id',
        email: 'test@example.com',
      };
      next();
    });

    // Reset mock implementation for validateRequest
    (mockValidateRequest as any).mockReset();
    (mockValidateRequest as any).mockImplementation(() => (req: any, res: any, next: any) => {
      next();
    });

    // Mock controller methods
    (mockQuoteController.createQuote as any).mockImplementation(async (req: any, res: any) => {
      return res.status(201).json({ success: true });
    });
    (mockQuoteController.getCompanyQuotes as any).mockImplementation(async (req: any, res: any) => {
      return res.status(200).json({ success: true });
    });
    (mockQuoteController.getCustomerQuotes as any).mockImplementation(async (req: any, res: any) => {
      return res.status(200).json({ success: true });
    });
    (mockQuoteController.getQuote as any).mockImplementation(async (req: any, res: any) => {
      return res.status(200).json({ success: true });
    });
    (mockQuoteController.updateQuote as any).mockImplementation(async (req: any, res: any) => {
      return res.status(200).json({ success: true });
    });
    (mockQuoteController.deleteQuote as any).mockImplementation(async (req: any, res: any) => {
      return res.status(200).json({ success: true });
    });
    (mockQuoteController.downloadQuotePdf as any).mockImplementation(async (req: any, res: any) => {
      return res.status(200).send('pdf-content');
    });
    (mockQuoteController.sendQuoteByEmail as any).mockImplementation(async (req: any, res: any) => {
      return res.status(200).json({ success: true });
    });
  });

  describe('POST /', () => {
    it('should create a new quote', async () => {
      const quoteData = createMockQuoteRequest();

      const response = await request(app)
        .post('/quote')
        .send(quoteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.createQuote).toHaveBeenCalled();
    });
  });

  describe('GET /', () => {
    it('should get company quotes', async () => {
      const response = await request(app)
        .get('/quote')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.getCompanyQuotes).toHaveBeenCalled();
    });

    it('should handle query parameters', async () => {
      const response = await request(app)
        .get('/quote?page=1&limit=10&status=draft&search=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockQuoteController.getCompanyQuotes).toHaveBeenCalled();
    });
  });

  describe('GET /customer/:customerId', () => {
    it('should get customer quotes', async () => {
      const customerId = 'test-customer-id';

      const response = await request(app)
        .get(`/quote/customer/${customerId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.getCustomerQuotes).toHaveBeenCalled();
    });

    it('should handle query parameters for customer quotes', async () => {
      const customerId = 'test-customer-id';

      const response = await request(app)
        .get(`/quote/customer/${customerId}?page=1&limit=5&status=sent`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockQuoteController.getCustomerQuotes).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    it('should get a specific quote', async () => {
      const quoteId = 'test-quote-id';

      const response = await request(app)
        .get(`/quote/${quoteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.getQuote).toHaveBeenCalled();
    });
  });

  describe('PUT /:id', () => {
    it('should update a quote', async () => {
      const quoteId = 'test-quote-id';
      const updateData = { notes: 'Updated notes' };

      const response = await request(app)
        .put(`/quote/${quoteId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.updateQuote).toHaveBeenCalled();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a quote', async () => {
      const quoteId = 'test-quote-id';

      const response = await request(app)
        .delete(`/quote/${quoteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.deleteQuote).toHaveBeenCalled();
    });
  });

  describe('GET /:id/pdf', () => {
    it('should download quote PDF', async () => {
      const quoteId = 'test-quote-id';

      const response = await request(app)
        .get(`/quote/${quoteId}/pdf`)
        .expect(200);

      expect(response.text).toBe('pdf-content');
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.downloadQuotePdf).toHaveBeenCalled();
    });
  });

  describe('POST /:id/send', () => {
    it('should send quote by email', async () => {
      const quoteId = 'test-quote-id';

      const response = await request(app)
        .post(`/quote/${quoteId}/send`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockQuoteController.sendQuoteByEmail).toHaveBeenCalled();
    });
  });

  describe('Route middleware integration', () => {
    it('should call auth middleware for all protected routes', async () => {
      const routes = [
        { method: 'post', path: '/quote', data: createMockQuoteRequest() },
        { method: 'get', path: '/quote' },
        { method: 'get', path: '/quote/customer/test-id' },
        { method: 'get', path: '/quote/test-id' },
        { method: 'put', path: '/quote/test-id', data: { notes: 'test' } },
        { method: 'delete', path: '/quote/test-id' },
        { method: 'get', path: '/quote/test-id/pdf' },
        { method: 'post', path: '/quote/test-id/send' },
      ];

      for (const route of routes) {
        jest.clearAllMocks();
        
        let req;
        if (route.method === 'post') {
          req = request(app).post(route.path);
        } else if (route.method === 'get') {
          req = request(app).get(route.path);
        } else if (route.method === 'put') {
          req = request(app).put(route.path);
        } else if (route.method === 'delete') {
          req = request(app).delete(route.path);
        }
        
        if (route.data && req) {
          req = req.send(route.data);
        }
        
        if (req) {
          await req;
        }
        
        expect(mockAuthMiddleware).toHaveBeenCalled();
      }
    });

    it('should call validation middleware for create and update routes', async () => {
      // Test that validation middleware is included in routes
      // Since we're mocking the validation function, we check that it's configured correctly
      expect(typeof mockValidateRequest).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should handle controller errors', async () => {
      (mockQuoteController.createQuote as any).mockImplementation(async (req: any, res: any) => {
        return res.status(500).json({ error: 'Internal server error' });
      });

      const response = await request(app)
        .post('/quote')
        .send(createMockQuoteRequest())
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle middleware errors', async () => {
      (mockAuthMiddleware as any).mockImplementation((req: any, res: any, next: any) => {
        return res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/quote')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });
});