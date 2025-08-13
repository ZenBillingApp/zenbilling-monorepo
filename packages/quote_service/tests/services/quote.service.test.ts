import { QuoteService } from '../../src/services/quote.service';
import { CustomError } from '@zenbilling/shared/src/utils/customError';
import axios from 'axios';

// Mock Decimal class first
class MockDecimal {
  private value: number;

  constructor(value: number | string) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }

  times(other: MockDecimal | number): MockDecimal {
    const otherValue = other instanceof MockDecimal ? other.value : other;
    return new MockDecimal(this.value * otherValue);
  }

  plus(other: MockDecimal): MockDecimal {
    return new MockDecimal(this.value + other.value);
  }

  div(other: MockDecimal | number): MockDecimal {
    const otherValue = other instanceof MockDecimal ? other.value : other;
    return new MockDecimal(this.value / otherValue);
  }

  toFixed(digits: number): string {
    return this.value.toFixed(digits);
  }
}

// Mock Prisma before importing anything
jest.mock('@zenbilling/shared/src/libs/prisma', () => {
  // Define MockDecimal inside the mock
  class LocalMockDecimal {
    private value: number;

    constructor(value: number | string) {
      this.value = typeof value === 'string' ? parseFloat(value) : value;
    }

    times(other: LocalMockDecimal | number): LocalMockDecimal {
      const otherValue = other instanceof LocalMockDecimal ? other.value : other;
      return new LocalMockDecimal(this.value * otherValue);
    }

    plus(other: LocalMockDecimal): LocalMockDecimal {
      return new LocalMockDecimal(this.value + other.value);
    }

    div(other: LocalMockDecimal | number): LocalMockDecimal {
      const otherValue = other instanceof LocalMockDecimal ? other.value : other;
      return new LocalMockDecimal(this.value / otherValue);
    }

    toFixed(digits: number): string {
      return this.value.toFixed(digits);
    }
  }

  return {
    __esModule: true,
    default: {
      quote: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    },
    Decimal: LocalMockDecimal,
  };
});

// Import test helpers after mocks
import {
  createMockQuote,
  createMockQuoteRequest,
  createMockProduct,
  clearAllMocks,
} from '../utils/test-helpers';

const mockPrisma = require('@zenbilling/shared/src/libs/prisma').default;
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('QuoteService', () => {
  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();
  });

  describe('createQuote', () => {
    it('should create a quote successfully', async () => {
      const userId = 'test-user-id';
      const companyId = 'test-company-id';
      const quoteData = createMockQuoteRequest();
      const mockQuote = createMockQuote();
      const mockProducts = [createMockProduct()];

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findMany: jest.fn().mockResolvedValue(mockProducts),
          },
          quote: {
            create: jest.fn().mockResolvedValue({
              quote_id: 'test-quote-id',
              quote_number: 'DEVIS-123456-202501-001',
            }),
            update: jest.fn().mockResolvedValue(mockQuote),
          },
        };
        return await callback(mockTx);
      });

      const result = await QuoteService.createQuote(userId, companyId, quoteData);

      expect(result).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if products not found', async () => {
      const userId = 'test-user-id';
      const companyId = 'test-company-id';
      const quoteData = createMockQuoteRequest();

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          product: {
            findMany: jest.fn().mockResolvedValue([]), // No products found
          },
          quote: {
            create: jest.fn(),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        QuoteService.createQuote(userId, companyId, quoteData)
      ).rejects.toThrow(CustomError);
    });

    it('should handle database errors', async () => {
      const userId = 'test-user-id';
      const companyId = 'test-company-id';
      const quoteData = createMockQuoteRequest();

      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        QuoteService.createQuote(userId, companyId, quoteData)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('updateQuote', () => {
    it('should update a quote successfully', async () => {
      const quoteId = 'test-quote-id';
      const companyId = 'test-company-id';
      const updateData = { notes: 'Updated notes' };
      const mockQuote = createMockQuote();
      const updatedQuote = createMockQuote({ notes: 'Updated notes' });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(mockQuote),
            update: jest.fn().mockResolvedValue(updatedQuote),
          },
        };
        return await callback(mockTx);
      });

      const result = await QuoteService.updateQuote(quoteId, companyId, updateData);

      expect(result).toEqual(updatedQuote);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if quote not found', async () => {
      const quoteId = 'non-existent-id';
      const companyId = 'test-company-id';
      const updateData = { notes: 'Updated notes' };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        QuoteService.updateQuote(quoteId, companyId, updateData)
      ).rejects.toThrow(CustomError);
    });

    it('should throw error if quote is accepted', async () => {
      const quoteId = 'test-quote-id';
      const companyId = 'test-company-id';
      const updateData = { notes: 'Updated notes' };
      const acceptedQuote = createMockQuote({ status: 'accepted' });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(acceptedQuote),
            update: jest.fn(),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        QuoteService.updateQuote(quoteId, companyId, updateData)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('getQuoteWithDetails', () => {
    it('should return quote with details successfully', async () => {
      const quoteId = 'test-quote-id';
      const companyId = 'test-company-id';
      const mockQuote = createMockQuote();

      mockPrisma.quote.findUnique.mockResolvedValue(mockQuote);

      const result = await QuoteService.getQuoteWithDetails(quoteId, companyId);

      expect(result).toEqual(mockQuote);
      expect(mockPrisma.quote.findUnique).toHaveBeenCalledWith({
        where: {
          quote_id: quoteId,
          company_id: companyId,
        },
        include: expect.objectContaining({
          items: expect.any(Object),
          customer: expect.any(Object),
          company: true,
          user: true,
        }),
      });
    });

    it('should throw error if quote not found', async () => {
      const quoteId = 'non-existent-id';
      const companyId = 'test-company-id';

      mockPrisma.quote.findUnique.mockResolvedValue(null);

      await expect(
        QuoteService.getQuoteWithDetails(quoteId, companyId)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('deleteQuote', () => {
    it('should delete a quote successfully', async () => {
      const quoteId = 'test-quote-id';
      const companyId = 'test-company-id';
      const mockQuote = createMockQuote();

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(mockQuote),
            delete: jest.fn().mockResolvedValue({}),
          },
        };
        return await callback(mockTx);
      });

      await QuoteService.deleteQuote(quoteId, companyId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error if quote is accepted', async () => {
      const quoteId = 'test-quote-id';
      const companyId = 'test-company-id';
      const acceptedQuote = createMockQuote({ status: 'accepted' });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          quote: {
            findUnique: jest.fn().mockResolvedValue(acceptedQuote),
            delete: jest.fn(),
          },
        };
        return await callback(mockTx);
      });

      await expect(
        QuoteService.deleteQuote(quoteId, companyId)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('getCompanyQuotes', () => {
    it('should return company quotes with pagination', async () => {
      const companyId = 'test-company-id';
      const mockQuotes = [createMockQuote(), createMockQuote()];
      const totalCount = 2;
      const statusCounts = [1, 1, 0, 0, 0, 2]; // draft, sent, accepted, rejected, expired, total

      mockPrisma.$transaction
        .mockResolvedValueOnce([mockQuotes, totalCount]) // First call for quotes and total
        .mockResolvedValueOnce(statusCounts); // Second call for status counts

      const result = await QuoteService.getCompanyQuotes(companyId);

      expect(result.quotes).toEqual(mockQuotes);
      expect(result.total).toBe(totalCount);
      expect(result.totalPages).toBe(1);
      expect(result.statusCounts).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should handle search parameters', async () => {
      const companyId = 'test-company-id';
      const queryParams = {
        search: 'Test',
        status: 'draft' as const,
        page: 2,
        limit: 5,
        min_amount: 50,
        max_amount: 200,
        sortBy: 'quote_date' as const,
        sortOrder: 'DESC' as const,
      };
      const mockQuotes = [createMockQuote()];
      const totalCount = 1;
      const statusCounts = [1, 0, 0, 0, 0, 1];

      mockPrisma.$transaction
        .mockResolvedValueOnce([mockQuotes, totalCount])
        .mockResolvedValueOnce(statusCounts);

      const result = await QuoteService.getCompanyQuotes(companyId, queryParams);

      expect(result.quotes).toEqual(mockQuotes);
      expect(result.total).toBe(totalCount);
    });
  });

  describe('sendQuoteByEmail', () => {
    it('should send quote by email successfully', async () => {
      const quoteId = 'test-quote-id';
      const companyId = 'test-company-id';
      const user = { id: 'test-user-id', first_name: 'Test', last_name: 'User' };
      const mockQuote = createMockQuote();
      
      // Mock PDF generation
      const pdfBuffer = Buffer.from('fake-pdf-content');
      mockAxios.post
        .mockResolvedValueOnce({ data: pdfBuffer }) // PDF generation
        .mockResolvedValueOnce({ data: { success: true } }); // Email sending

      // Mock quote update
      mockPrisma.quote.update.mockResolvedValue(mockQuote);

      // Mock getQuoteWithDetails
      QuoteService.getQuoteWithDetails = jest.fn().mockResolvedValue(mockQuote);

      await QuoteService.sendQuoteByEmail(quoteId, companyId, user);

      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(mockPrisma.quote.update).toHaveBeenCalledWith({
        where: { quote_id: quoteId },
        data: { status: 'sent' },
      });
    });

    it('should throw error if customer has no email', async () => {
      const quoteId = 'test-quote-id';
      const companyId = 'test-company-id';
      const user = { id: 'test-user-id', first_name: 'Test', last_name: 'User' };
      const mockQuote = createMockQuote({
        customer: { ...createMockQuote().customer, email: null }
      });

      QuoteService.getQuoteWithDetails = jest.fn().mockResolvedValue(mockQuote);

      await expect(
        QuoteService.sendQuoteByEmail(quoteId, companyId, user)
      ).rejects.toThrow(CustomError);
    });
  });

  describe('updateExpiredQuotes', () => {
    it('should update expired quotes successfully', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          quote: {
            updateMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
        };
        return await callback(mockTx);
      });

      await QuoteService.updateExpiredQuotes();

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(QuoteService.updateExpiredQuotes()).rejects.toThrow(CustomError);
    });
  });

  describe('getCustomerQuotes', () => {
    it('should return customer quotes successfully', async () => {
      const customerId = 'test-customer-id';
      const companyId = 'test-company-id';
      const mockQuotes = [createMockQuote()];
      const totalCount = 1;

      mockPrisma.quote.findMany.mockResolvedValue(mockQuotes);
      mockPrisma.quote.count.mockResolvedValue(totalCount);

      const result = await QuoteService.getCustomerQuotes(customerId, companyId);

      expect(result.quotes).toEqual(mockQuotes);
      expect(result.total).toBe(totalCount);
      expect(result.totalPages).toBe(1);
    });

    it('should handle query parameters', async () => {
      const customerId = 'test-customer-id';
      const companyId = 'test-company-id';
      const queryParams = {
        page: 2,
        limit: 5,
        search: 'test',
        status: 'draft' as const,
      };
      const mockQuotes = [createMockQuote()];

      mockPrisma.quote.findMany.mockResolvedValue(mockQuotes);
      mockPrisma.quote.count.mockResolvedValue(1);

      const result = await QuoteService.getCustomerQuotes(customerId, companyId, queryParams);

      expect(result.quotes).toEqual(mockQuotes);
      expect(mockPrisma.quote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customer_id: customerId,
            company_id: companyId,
          }),
          take: 5,
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
        })
      );
    });
  });
});