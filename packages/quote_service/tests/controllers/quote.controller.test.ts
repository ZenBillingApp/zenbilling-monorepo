import { QuoteController } from '../../src/controllers/quote.controller';
import { QuoteService } from '../../src/services/quote.service';
import { ApiResponse } from '@zenbilling/shared/src/utils/apiResponse';
import { CustomError } from '@zenbilling/shared/src/utils/customError';
import {
  createMockAuthRequest,
  createMockResponse,
  createMockQuote,
  createMockQuoteRequest,
  clearAllMocks,
} from '../utils/test-helpers';
import axios from 'axios';

// Mock dependencies
jest.mock('../../src/services/quote.service');
jest.mock('@zenbilling/shared/src/utils/apiResponse');
jest.mock('axios');

const mockQuoteService = QuoteService as jest.Mocked<typeof QuoteService>;
const mockApiResponse = ApiResponse as jest.Mocked<typeof ApiResponse>;
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('QuoteController', () => {
  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();
  });

  describe('createQuote', () => {
    it('should create a quote successfully', async () => {
      const req = createMockAuthRequest({
        body: createMockQuoteRequest(),
      });
      const res = createMockResponse();
      const mockQuote = createMockQuote();

      mockQuoteService.createQuote.mockResolvedValue(mockQuote);
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.createQuote(req, res);

      expect(mockQuoteService.createQuote).toHaveBeenCalledWith(
        req.user!.id,
        req.user!.company_id,
        req.body
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        201,
        'Devis créé avec succès',
        mockQuote
      );
    });

    it('should return error if user has no company', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        body: createMockQuoteRequest(),
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.createQuote(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        401,
        'Aucune entreprise associée à l\'utilisateur'
      );
      expect(mockQuoteService.createQuote).not.toHaveBeenCalled();
    });

    it('should handle CustomError', async () => {
      const req = createMockAuthRequest({
        body: createMockQuoteRequest(),
      });
      const res = createMockResponse();
      const customError = new CustomError('Test error', 400);

      mockQuoteService.createQuote.mockRejectedValue(customError);
      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.createQuote(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Test error'
      );
    });

    it('should handle generic error', async () => {
      const req = createMockAuthRequest({
        body: createMockQuoteRequest(),
      });
      const res = createMockResponse();

      mockQuoteService.createQuote.mockRejectedValue(new Error('Generic error'));
      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.createQuote(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur interne du serveur'
      );
    });
  });

  describe('updateQuote', () => {
    it('should update a quote successfully', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-quote-id' },
        body: { notes: 'Updated notes' },
      });
      const res = createMockResponse();
      const mockQuote = createMockQuote({ notes: 'Updated notes' });

      mockQuoteService.updateQuote.mockResolvedValue(mockQuote);
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.updateQuote(req, res);

      expect(mockQuoteService.updateQuote).toHaveBeenCalledWith(
        'test-quote-id',
        req.user!.company_id,
        req.body
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Devis mis à jour avec succès',
        mockQuote
      );
    });

    it('should return error if user has no company', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        params: { id: 'test-quote-id' },
        body: { notes: 'Updated notes' },
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.updateQuote(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        401,
        'Aucune entreprise associée à l\'utilisateur'
      );
    });
  });

  describe('deleteQuote', () => {
    it('should delete a quote successfully', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();

      mockQuoteService.deleteQuote.mockResolvedValue();
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.deleteQuote(req, res);

      expect(mockQuoteService.deleteQuote).toHaveBeenCalledWith(
        'test-quote-id',
        req.user!.company_id
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Devis supprimé avec succès'
      );
    });

    it('should return error if user has no company', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.deleteQuote(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        401,
        'Aucune entreprise associée à l\'utilisateur'
      );
    });
  });

  describe('getQuote', () => {
    it('should get a quote successfully', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();
      const mockQuote = createMockQuote();

      mockQuoteService.getQuoteWithDetails.mockResolvedValue(mockQuote);
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.getQuote(req, res);

      expect(mockQuoteService.getQuoteWithDetails).toHaveBeenCalledWith(
        'test-quote-id',
        req.user!.company_id
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Devis récupéré avec succès',
        mockQuote
      );
    });

    it('should return error if user has no company', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.getQuote(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        401,
        'Aucune entreprise associée à l\'utilisateur'
      );
    });
  });

  describe('getCompanyQuotes', () => {
    it('should get company quotes successfully', async () => {
      const req = createMockAuthRequest({
        query: {
          page: '1',
          limit: '10',
          search: 'test',
          status: 'draft',
        },
      });
      const res = createMockResponse();
      const mockResult = {
        quotes: [createMockQuote()],
        total: 1,
        totalPages: 1,
        statusCounts: {
          draft: 1,
          sent: 0,
          accepted: 0,
          rejected: 0,
          expired: 0,
          total: 1,
        },
      };

      mockQuoteService.getCompanyQuotes.mockResolvedValue(mockResult);
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.getCompanyQuotes(req, res);

      expect(mockQuoteService.getCompanyQuotes).toHaveBeenCalledWith(
        req.user!.company_id,
        expect.objectContaining({
          page: 1,
          limit: 10,
          search: 'test',
          status: 'draft',
        })
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Devis récupérés avec succès',
        expect.objectContaining({
          quotes: mockResult.quotes,
          pagination: expect.objectContaining({
            total: 1,
            totalPages: 1,
            currentPage: 1,
            limit: 10,
          }),
          stats: {
            statusCounts: mockResult.statusCounts,
          },
        })
      );
    });

    it('should handle query parameters parsing', async () => {
      const req = createMockAuthRequest({
        query: {
          page: '2',
          limit: '5',
          min_amount: '100.50',
          max_amount: '500.75',
          sortBy: 'quote_date',
          sortOrder: 'DESC',
        },
      });
      const res = createMockResponse();
      const mockResult = {
        quotes: [],
        total: 0,
        totalPages: 0,
        statusCounts: {
          draft: 0,
          sent: 0,
          accepted: 0,
          rejected: 0,
          expired: 0,
          total: 0,
        },
      };

      mockQuoteService.getCompanyQuotes.mockResolvedValue(mockResult);
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.getCompanyQuotes(req, res);

      expect(mockQuoteService.getCompanyQuotes).toHaveBeenCalledWith(
        req.user!.company_id,
        expect.objectContaining({
          page: 2,
          limit: 5,
          min_amount: 100.50,
          max_amount: 500.75,
          sortBy: 'quote_date',
          sortOrder: 'DESC',
        })
      );
    });
  });

  describe('downloadQuotePdf', () => {
    it('should download quote PDF successfully', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();
      const mockQuote = createMockQuote();
      const pdfData = Buffer.from('fake-pdf-content');

      mockQuoteService.getQuoteWithDetails.mockResolvedValue(mockQuote);
      mockAxios.post.mockResolvedValue({ data: pdfData });

      await QuoteController.downloadQuotePdf(req, res);

      expect(mockQuoteService.getQuoteWithDetails).toHaveBeenCalledWith(
        'test-quote-id',
        req.user!.company_id
      );
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${process.env.PDF_SERVICE_URL}/api/pdf/quote`,
        {
          quote: mockQuote,
          company: mockQuote.company,
        },
        {
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=devis-${mockQuote.quote_number}.pdf`
      );
      expect(res.send).toHaveBeenCalledWith(pdfData);
    });

    it('should return error if user has no company', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.downloadQuotePdf(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        401,
        'Aucune entreprise associée à l\'utilisateur'
      );
    });

    it('should return error if user tries to access quote from different company', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();
      const mockQuote = createMockQuote({ company_id: 'different-company-id' });

      mockQuoteService.getQuoteWithDetails.mockResolvedValue(mockQuote);
      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.downloadQuotePdf(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        403,
        'Accès non autorisé à ce devis'
      );
    });
  });

  describe('sendQuoteByEmail', () => {
    it('should send quote by email successfully', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();

      mockQuoteService.sendQuoteByEmail.mockResolvedValue();
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.sendQuoteByEmail(req, res);

      expect(mockQuoteService.sendQuoteByEmail).toHaveBeenCalledWith(
        'test-quote-id',
        req.user!.company_id,
        req.user
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Devis envoyé par email avec succès'
      );
    });

    it('should return error if user has no company', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.sendQuoteByEmail(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        401,
        'Aucune entreprise associée à l\'utilisateur'
      );
    });

    it('should handle regular Error', async () => {
      const req = createMockAuthRequest({
        params: { id: 'test-quote-id' },
      });
      const res = createMockResponse();
      const error = new Error('Regular error');

      mockQuoteService.sendQuoteByEmail.mockRejectedValue(error);
      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.sendQuoteByEmail(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Regular error'
      );
    });
  });

  describe('getCustomerQuotes', () => {
    it('should get customer quotes successfully', async () => {
      const req = createMockAuthRequest({
        params: { customerId: 'test-customer-id' },
        query: {
          page: '1',
          limit: '10',
          search: 'test',
        },
      });
      const res = createMockResponse();
      const mockResult = {
        quotes: [createMockQuote()],
        total: 1,
        totalPages: 1,
      };

      mockQuoteService.getCustomerQuotes.mockResolvedValue(mockResult);
      mockApiResponse.success.mockReturnValue(res);

      await QuoteController.getCustomerQuotes(req, res);

      expect(mockQuoteService.getCustomerQuotes).toHaveBeenCalledWith(
        'test-customer-id',
        req.user!.company_id,
        expect.objectContaining({
          page: 1,
          limit: 10,
          search: 'test',
        })
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Devis du client récupérés avec succès',
        expect.objectContaining({
          quotes: mockResult.quotes,
          pagination: expect.objectContaining({
            total: 1,
            totalPages: 1,
            currentPage: 1,
            limit: 10,
          }),
        })
      );
    });

    it('should return error if user has no company', async () => {
      const req = createMockAuthRequest({
        user: { ...createMockAuthRequest().user, company_id: null } as any,
        params: { customerId: 'test-customer-id' },
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await QuoteController.getCustomerQuotes(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        401,
        'Aucune entreprise associée à l\'utilisateur'
      );
    });
  });
});