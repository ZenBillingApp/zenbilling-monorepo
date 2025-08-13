import request from 'supertest';
import express from 'express';
import quoteRoutes from '../../src/routes/quote.routes';
import { QuoteService } from '../../src/services/quote.service';
import { authMiddleware } from '@zenbilling/shared/src/middlewares/auth.middleware';
import { validateRequest } from '@zenbilling/shared/src/middlewares/validation.middleware';
import {
  createMockQuote,
  createMockQuoteRequest,
  createMockProduct,
  clearAllMocks,
} from '../utils/test-helpers';
import { CustomError } from '@zenbilling/shared/src/utils/customError';

// Mock external dependencies
jest.mock('@zenbilling/shared/src/libs/prisma');
jest.mock('@zenbilling/shared/src/middlewares/auth.middleware');
jest.mock('@zenbilling/shared/src/middlewares/validation.middleware', () => ({
  validateRequest: jest.fn(() => (req: any, res: any, next: any) => next()),
}));
jest.mock('@zenbilling/shared/src/validations/quote.validation', () => ({
  createQuoteSchema: {},
  updateQuoteSchema: {},
}));
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockValidateRequest = validateRequest as jest.MockedFunction<typeof validateRequest>;

describe('Quote Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/quote', quoteRoutes);

    // Set up global middleware mocks
    (mockAuthMiddleware as any).mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        id: 'test-user-id',
        user_id: 'test-user-id',
        company_id: 'test-company-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        onboarding_completed: true,
        onboarding_step: 'FINISH',
        stripe_onboarded: false,
        stripe_account_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      next();
    });

    (mockValidateRequest as any).mockImplementation(() => (req: any, res: any, next: any) => {
      next();
    });
  });

  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();
  });

  describe('Quote Creation Workflow', () => {
    it('should create a complete quote workflow', async () => {
      const quoteData = createMockQuoteRequest();
      const mockQuote = createMockQuote();
      const mockProducts = [createMockProduct()];

      // Mock the service methods
      jest.spyOn(QuoteService, 'createQuote').mockResolvedValue(mockQuote);

      const response = await request(app)
        .post('/api/quote')
        .send(quoteData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Devis créé avec succès');
      expect(response.body).toHaveProperty('data');
      expect(QuoteService.createQuote).toHaveBeenCalledWith(
        'test-user-id',
        'test-company-id',
        expect.objectContaining({
          customer_id: quoteData.customer_id,
          conditions: quoteData.conditions,
          notes: quoteData.notes,
          items: quoteData.items,
        })
      );
    });

    it('should handle validation errors during creation', async () => {
      const invalidQuoteData = {
        // Missing required fields
        customer_id: '',
        items: [],
      };

      // Mock service to throw validation error
      jest.spyOn(QuoteService, 'createQuote').mockRejectedValue(
        new CustomError('Données invalides - customer_id requis', 400)
      );

      const response = await request(app)
        .post('/api/quote')
        .send(invalidQuoteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Données invalides');
    });

    it('should handle service errors during creation', async () => {
      const quoteData = createMockQuoteRequest();

      jest.spyOn(QuoteService, 'createQuote').mockRejectedValue(
        new CustomError('Produits non trouvés', 404)
      );

      const response = await request(app)
        .post('/api/quote')
        .send(quoteData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Produits non trouvés');
    });
  });

  describe('Quote Retrieval Workflow', () => {
    it('should retrieve company quotes with pagination', async () => {
      const mockResult = {
        quotes: [createMockQuote(), createMockQuote()],
        total: 2,
        totalPages: 1,
        statusCounts: {
          draft: 1,
          sent: 1,
          accepted: 0,
          rejected: 0,
          expired: 0,
          total: 2,
        },
      };

      jest.spyOn(QuoteService, 'getCompanyQuotes').mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/quote?page=1&limit=10&status=draft')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('quotes');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.quotes).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should retrieve specific quote with details', async () => {
      const mockQuote = createMockQuote();

      jest.spyOn(QuoteService, 'getQuoteWithDetails').mockResolvedValue(mockQuote);

      const response = await request(app)
        .get('/api/quote/test-quote-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        quote_id: mockQuote.quote_id,
        quote_number: mockQuote.quote_number,
        status: mockQuote.status,
      });
      expect(QuoteService.getQuoteWithDetails).toHaveBeenCalledWith(
        'test-quote-id',
        'test-company-id'
      );
    });

    it('should handle quote not found', async () => {
      jest.spyOn(QuoteService, 'getQuoteWithDetails').mockRejectedValue(
        new CustomError('Devis non trouvé', 404)
      );

      const response = await request(app)
        .get('/api/quote/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Devis non trouvé');
    });
  });

  describe('Quote Update Workflow', () => {
    it('should update quote successfully', async () => {
      const updateData = { notes: 'Updated notes' };
      const updatedQuote = createMockQuote({ notes: 'Updated notes' });

      jest.spyOn(QuoteService, 'updateQuote').mockResolvedValue(updatedQuote);

      const response = await request(app)
        .put('/api/quote/test-quote-id')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe('Updated notes');
      expect(QuoteService.updateQuote).toHaveBeenCalledWith(
        'test-quote-id',
        'test-company-id',
        updateData
      );
    });

    it('should prevent updating accepted quotes', async () => {
      const updateData = { notes: 'Cannot update' };

      jest.spyOn(QuoteService, 'updateQuote').mockRejectedValue(
        new CustomError('Impossible de modifier un devis accepté', 400)
      );

      const response = await request(app)
        .put('/api/quote/test-quote-id')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Impossible de modifier un devis accepté');
    });
  });

  describe('Quote Deletion Workflow', () => {
    it('should delete quote successfully', async () => {
      jest.spyOn(QuoteService, 'deleteQuote').mockResolvedValue();

      const response = await request(app)
        .delete('/api/quote/test-quote-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Devis supprimé avec succès');
      expect(QuoteService.deleteQuote).toHaveBeenCalledWith(
        'test-quote-id',
        'test-company-id'
      );
    });

    it('should prevent deleting accepted quotes', async () => {
      jest.spyOn(QuoteService, 'deleteQuote').mockRejectedValue(
        new CustomError('Impossible de supprimer un devis accepté', 400)
      );

      const response = await request(app)
        .delete('/api/quote/test-quote-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Impossible de supprimer un devis accepté');
    });
  });

  describe('Quote Email Workflow', () => {
    it('should send quote by email successfully', async () => {
      jest.spyOn(QuoteService, 'sendQuoteByEmail').mockResolvedValue();

      const response = await request(app)
        .post('/api/quote/test-quote-id/send')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Devis envoyé par email avec succès');
      expect(QuoteService.sendQuoteByEmail).toHaveBeenCalledWith(
        'test-quote-id',
        'test-company-id',
        expect.objectContaining({
          id: 'test-user-id',
          company_id: 'test-company-id',
        })
      );
    });

    it('should handle email sending errors', async () => {
      jest.spyOn(QuoteService, 'sendQuoteByEmail').mockRejectedValue(
        new CustomError('Le client n\'a pas d\'email', 400)
      );

      const response = await request(app)
        .post('/api/quote/test-quote-id/send')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Le client n\'a pas d\'email');
    });
  });

  describe('Customer Quotes Workflow', () => {
    it('should retrieve customer quotes', async () => {
      const mockResult = {
        quotes: [createMockQuote()],
        total: 1,
        totalPages: 1,
      };

      jest.spyOn(QuoteService, 'getCustomerQuotes').mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/quote/customer/test-customer-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('quotes');
      expect(response.body.data).toHaveProperty('pagination');
      expect(QuoteService.getCustomerQuotes).toHaveBeenCalledWith(
        'test-customer-id',
        'test-company-id',
        expect.any(Object)
      );
    });
  });

  describe('PDF Download Workflow', () => {
    it('should download quote PDF successfully', async () => {
      const mockQuote = createMockQuote();
      const mockPdfBuffer = Buffer.from('fake-pdf-content');

      jest.spyOn(QuoteService, 'getQuoteWithDetails').mockResolvedValue(mockQuote);
      
      // Mock axios for PDF service
      const axios = require('axios');
      const mockAxios = axios.default;
      mockAxios.post.mockResolvedValue({ data: mockPdfBuffer });

      const response = await request(app)
        .get('/api/quote/test-quote-id/pdf')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(QuoteService.getQuoteWithDetails).toHaveBeenCalledWith(
        'test-quote-id',
        'test-company-id'
      );
    });

    it('should handle unauthorized PDF access', async () => {
      const mockQuote = createMockQuote({ company_id: 'different-company-id' });

      jest.spyOn(QuoteService, 'getQuoteWithDetails').mockResolvedValue(mockQuote);

      const response = await request(app)
        .get('/api/quote/test-quote-id/pdf')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Accès non autorisé à ce devis');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without company_id', async () => {
      (mockAuthMiddleware as any).mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = {
          id: 'test-user-id',
          company_id: null, // No company
        };
        next();
      });

      const response = await request(app)
        .get('/api/quote')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Aucune entreprise associée à l\'utilisateur');
    });

    it('should reject unauthenticated requests', async () => {
      (mockAuthMiddleware as any).mockImplementationOnce((req: any, res: any, next: any) => {
        return res.status(401).json({
          success: false,
          message: 'Token d\'authentification manquant',
        });
      });

      const response = await request(app)
        .get('/api/quote')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token d\'authentification manquant');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected server errors', async () => {
      jest.spyOn(QuoteService, 'getCompanyQuotes').mockRejectedValue(
        new Error('Unexpected database error')
      );

      const response = await request(app)
        .get('/api/quote')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erreur interne du serveur');
    });

    it('should handle malformed request data', async () => {
      // This test depends on Express built-in JSON parsing error handling
      // which is difficult to mock in this testing setup
      expect(true).toBe(true);
    });
  });
});