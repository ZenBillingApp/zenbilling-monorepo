import { AIProductService } from '../../src/services/ai-product.service';
import { AIClient } from '../../src/clients/ai.client';
import {
  createMockAIResponse,
  createMockAISuggestionsResponse,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock AIClient
jest.mock('../../src/clients/ai.client');

const mockAIClient = AIClient as jest.MockedClass<typeof AIClient>;

describe('AIProductService', () => {
  let aiProductService: AIProductService;
  let mockAIClientInstance: jest.Mocked<AIClient>;

  beforeEach(() => {
    clearAllMocks();
    
    mockAIClientInstance = {
      generateText: jest.fn(),
      generateSuggestions: jest.fn(),
      improveText: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

    mockAIClient.mockImplementation(() => mockAIClientInstance);
    
    aiProductService = new AIProductService();
  });

  describe('generateProductDescription', () => {
    it('should generate product description successfully', async () => {
      const request = {
        productName: 'Test Product',
        category: 'Electronics',
        additionalInfo: 'High quality product',
      };
      const mockDescription = 'Generated professional description';

      mockAIClientInstance.generateText.mockResolvedValue(mockDescription);

      const result = await aiProductService.generateProductDescription(request);

      expect(mockAIClientInstance.generateText).toHaveBeenCalledWith({
        prompt: expect.stringContaining('Test Product'),
        systemMessage: expect.stringContaining('descriptions de produits'),
        maxTokens: 150,
        temperature: 0.7,
      });
      expect(result).toEqual({
        description: mockDescription,
        generatedAt: expect.any(Date),
        productName: request.productName,
      });
    });

    it('should include category in prompt when provided', async () => {
      const request = {
        productName: 'Test Product',
        category: 'Electronics',
      };
      const mockDescription = 'Generated description';

      mockAIClientInstance.generateText.mockResolvedValue(mockDescription);

      await aiProductService.generateProductDescription(request);

      const callArgs = mockAIClientInstance.generateText.mock.calls[0][0];
      expect(callArgs.prompt).toContain('Catégorie : Electronics');
    });

    it('should include additional info in prompt when provided', async () => {
      const request = {
        productName: 'Test Product',
        additionalInfo: 'Premium quality',
      };
      const mockDescription = 'Generated description';

      mockAIClientInstance.generateText.mockResolvedValue(mockDescription);

      await aiProductService.generateProductDescription(request);

      const callArgs = mockAIClientInstance.generateText.mock.calls[0][0];
      expect(callArgs.prompt).toContain('Informations supplémentaires : Premium quality');
    });

    it('should handle AI client errors', async () => {
      const request = {
        productName: 'Test Product',
      };

      mockAIClientInstance.generateText.mockRejectedValue(new Error('AI service error'));

      await expect(aiProductService.generateProductDescription(request)).rejects.toThrow('AI service error');
    });
  });

  describe('generateProductDescriptionSuggestions', () => {
    it('should generate suggestions successfully', async () => {
      const request = {
        productName: 'Test Product',
        category: 'Electronics',
        count: 3,
      };
      const mockSuggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];

      mockAIClientInstance.generateSuggestions.mockResolvedValue(mockSuggestions);

      const result = await aiProductService.generateProductDescriptionSuggestions(request);

      expect(mockAIClientInstance.generateSuggestions).toHaveBeenCalledWith({
        prompt: expect.stringContaining('Test Product'),
        count: 3,
        systemMessage: expect.stringContaining('descriptions de produits'),
      });
      expect(result).toEqual({
        suggestions: mockSuggestions,
        generatedAt: expect.any(Date),
        productName: request.productName,
        count: mockSuggestions.length,
      });
    });

    it('should limit count to maximum 5', async () => {
      const request = {
        productName: 'Test Product',
        count: 10, // Over the limit
      };
      const mockSuggestions = ['Suggestion 1', 'Suggestion 2'];

      mockAIClientInstance.generateSuggestions.mockResolvedValue(mockSuggestions);

      await aiProductService.generateProductDescriptionSuggestions(request);

      const callArgs = mockAIClientInstance.generateSuggestions.mock.calls[0][0];
      expect(callArgs.count).toBe(5); // Should be limited to 5
    });

    it('should use default count when not provided', async () => {
      const request = {
        productName: 'Test Product',
      };
      const mockSuggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];

      mockAIClientInstance.generateSuggestions.mockResolvedValue(mockSuggestions);

      await aiProductService.generateProductDescriptionSuggestions(request);

      const callArgs = mockAIClientInstance.generateSuggestions.mock.calls[0][0];
      expect(callArgs.count).toBe(3); // Default count
    });

    it('should include category in prompt when provided', async () => {
      const request = {
        productName: 'Test Product',
        category: 'Electronics',
        count: 2,
      };
      const mockSuggestions = ['Suggestion 1', 'Suggestion 2'];

      mockAIClientInstance.generateSuggestions.mockResolvedValue(mockSuggestions);

      await aiProductService.generateProductDescriptionSuggestions(request);

      const callArgs = mockAIClientInstance.generateSuggestions.mock.calls[0][0];
      expect(callArgs.prompt).toContain('Catégorie : Electronics');
    });
  });

  describe('improveProductDescription', () => {
    it('should improve description with custom improvements', async () => {
      const productName = 'Test Product';
      const currentDescription = 'Current description';
      const improvements = 'Make it more professional';
      const improvedDescription = 'Professional improved description';

      mockAIClientInstance.improveText.mockResolvedValue(improvedDescription);

      const result = await aiProductService.improveProductDescription(
        productName,
        currentDescription,
        improvements
      );

      expect(mockAIClientInstance.improveText).toHaveBeenCalledWith(
        currentDescription,
        `Améliore cette description de produit selon ces directives : ${improvements}`
      );
      expect(result).toBe(improvedDescription);
    });

    it('should improve description with default improvements when not provided', async () => {
      const productName = 'Test Product';
      const currentDescription = 'Current description';
      const improvedDescription = 'Default improved description';

      mockAIClientInstance.improveText.mockResolvedValue(improvedDescription);

      const result = await aiProductService.improveProductDescription(
        productName,
        currentDescription
      );

      expect(mockAIClientInstance.improveText).toHaveBeenCalledWith(
        currentDescription,
        expect.stringContaining('plus professionnelle, claire et adaptée à une facture française')
      );
      expect(result).toBe(improvedDescription);
    });

    it('should handle AI client errors', async () => {
      const productName = 'Test Product';
      const currentDescription = 'Current description';

      mockAIClientInstance.improveText.mockRejectedValue(new Error('AI service error'));

      await expect(
        aiProductService.improveProductDescription(productName, currentDescription)
      ).rejects.toThrow('AI service error');
    });
  });

  describe('generateProductKeywords', () => {
    it('should generate keywords with description', async () => {
      const productName = 'Test Product';
      const description = 'Product description';
      const mockKeywordsText = 'keyword1, keyword2, keyword3';
      const expectedKeywords = ['keyword1', 'keyword2', 'keyword3'];

      mockAIClientInstance.generateText.mockResolvedValue(mockKeywordsText);

      const result = await aiProductService.generateProductKeywords(productName, description);

      expect(mockAIClientInstance.generateText).toHaveBeenCalledWith({
        prompt: expect.stringContaining(productName),
        systemMessage: expect.stringContaining('mots-clés'),
        maxTokens: 100,
        temperature: 0.5,
      });
      expect(result).toEqual(expectedKeywords);
    });

    it('should generate keywords without description', async () => {
      const productName = 'Test Product';
      const mockKeywordsText = 'keyword1, keyword2';
      const expectedKeywords = ['keyword1', 'keyword2'];

      mockAIClientInstance.generateText.mockResolvedValue(mockKeywordsText);

      const result = await aiProductService.generateProductKeywords(productName);

      const callArgs = mockAIClientInstance.generateText.mock.calls[0][0];
      expect(callArgs.prompt).toContain(productName);
      expect(callArgs.prompt).not.toContain('Description :');
      expect(result).toEqual(expectedKeywords);
    });

    it('should parse keywords with newlines', async () => {
      const productName = 'Test Product';
      const mockKeywordsText = 'keyword1\nkeyword2\nkeyword3';
      const expectedKeywords = ['keyword1', 'keyword2', 'keyword3'];

      mockAIClientInstance.generateText.mockResolvedValue(mockKeywordsText);

      const result = await aiProductService.generateProductKeywords(productName);

      expect(result).toEqual(expectedKeywords);
    });

    it('should limit keywords to maximum 8', async () => {
      const productName = 'Test Product';
      const mockKeywordsText = 'k1, k2, k3, k4, k5, k6, k7, k8, k9, k10';

      mockAIClientInstance.generateText.mockResolvedValue(mockKeywordsText);

      const result = await aiProductService.generateProductKeywords(productName);

      expect(result).toHaveLength(8);
    });

    it('should filter out empty keywords', async () => {
      const productName = 'Test Product';
      const mockKeywordsText = 'keyword1, , keyword2,   , keyword3';
      const expectedKeywords = ['keyword1', 'keyword2', 'keyword3'];

      mockAIClientInstance.generateText.mockResolvedValue(mockKeywordsText);

      const result = await aiProductService.generateProductKeywords(productName);

      expect(result).toEqual(expectedKeywords);
    });
  });

  describe('isAIServiceAvailable', () => {
    it('should return true when AI service is available', async () => {
      mockAIClientInstance.healthCheck.mockResolvedValue(true);

      const result = await aiProductService.isAIServiceAvailable();

      expect(result).toBe(true);
      expect(mockAIClientInstance.healthCheck).toHaveBeenCalled();
    });

    it('should return false when AI service is unavailable', async () => {
      mockAIClientInstance.healthCheck.mockResolvedValue(false);

      const result = await aiProductService.isAIServiceAvailable();

      expect(result).toBe(false);
    });

    it('should return false when health check throws error', async () => {
      mockAIClientInstance.healthCheck.mockRejectedValue(new Error('Health check failed'));

      const result = await aiProductService.isAIServiceAvailable();

      expect(result).toBe(false);
    });
  });
});