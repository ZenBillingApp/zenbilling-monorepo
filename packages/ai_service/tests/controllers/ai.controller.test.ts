import { AIController } from '../../src/controllers/ai.controller';
import { AIService } from '../../src/services/ai.service';
import { ApiResponse } from '@zenbilling/shared/src/utils/apiResponse';
import {
  createMockRequest,
  createMockResponse,
  createMockTextGenerationRequest,
  createMockChatCompletionRequest,
  createMockChatCompletionResponse,
  createMockSuggestions,
  createMockOpenAIError,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock dependencies
jest.mock('../../src/services/ai.service');
jest.mock('@zenbilling/shared/src/utils/apiResponse');

const MockedAIService = AIService as jest.MockedClass<typeof AIService>;
const mockApiResponse = ApiResponse as any;

describe('AIController', () => {
  let aiController: AIController;
  let mockService: jest.Mocked<AIService>;

  beforeEach(() => {
    clearAllMocks();
    
    // Create mock service instance
    mockService = {
      generateText: jest.fn(),
      chatCompletion: jest.fn(),
      generateSuggestions: jest.fn(),
      improveText: jest.fn(),
      translateText: jest.fn(),
      summarizeText: jest.fn(),
    } as any;

    // Mock the constructor to return our mock service
    MockedAIService.mockImplementation(() => mockService);
    
    aiController = new AIController();
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const req = createMockRequest({
        body: {
          prompt: 'Test prompt',
          systemMessage: 'Test system message',
          model: 'gpt-3.5-turbo',
          maxTokens: 100,
          temperature: 0.8,
        },
      });
      const res = createMockResponse();
      const generatedText = 'Generated text response';

      mockService.generateText.mockResolvedValue(generatedText);

      await aiController.generateText(req, res);

      expect(mockService.generateText).toHaveBeenCalledWith({
        prompt: 'Test prompt',
        systemMessage: 'Test system message',
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0.8,
      });
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Texte généré avec succès',
        generatedText
      );
    });

    it('should return error if prompt is missing', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await aiController.generateText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le prompt est requis'
      );
    });

    it('should handle service errors', async () => {
      const req = createMockRequest({
        body: { prompt: 'Test prompt' },
      });
      const res = createMockResponse();
      const error = createMockOpenAIError('Service error');

      mockService.generateText.mockRejectedValue(error);

      await aiController.generateText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur lors de la génération de texte'
      );
    });
  });

  describe('chatCompletion', () => {
    it('should complete chat successfully', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      const req = createMockRequest({
        body: {
          messages,
          model: 'gpt-3.5-turbo',
          maxTokens: 150,
          temperature: 0.7,
        },
      });
      const res = createMockResponse();
      const mockResponse = createMockChatCompletionResponse();

      mockService.chatCompletion.mockResolvedValue(mockResponse);

      await aiController.chatCompletion(req, res);

      expect(mockService.chatCompletion).toHaveBeenCalledWith({
        messages,
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.7,
      });
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Chat completion réalisé avec succès',
        mockResponse
      );
    });

    it('should return error if messages are missing', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await aiController.chatCompletion(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Les messages sont requis'
      );
    });

    it('should return error if messages is not an array', async () => {
      const req = createMockRequest({
        body: {
          messages: 'not an array',
        },
      });
      const res = createMockResponse();

      await aiController.chatCompletion(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Les messages sont requis'
      );
    });

    it('should return error if messages array is empty', async () => {
      const req = createMockRequest({
        body: {
          messages: [],
        },
      });
      const res = createMockResponse();

      await aiController.chatCompletion(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Les messages sont requis'
      );
    });

    it('should validate message structure - missing role', async () => {
      const req = createMockRequest({
        body: {
          messages: [{ content: 'Hello' }],
        },
      });
      const res = createMockResponse();

      await aiController.chatCompletion(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Chaque message doit avoir un role et un content'
      );
    });

    it('should validate message structure - missing content', async () => {
      const req = createMockRequest({
        body: {
          messages: [{ role: 'user' }],
        },
      });
      const res = createMockResponse();

      await aiController.chatCompletion(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Chaque message doit avoir un role et un content'
      );
    });

    it('should validate message role values', async () => {
      const req = createMockRequest({
        body: {
          messages: [{ role: 'invalid', content: 'Hello' }],
        },
      });
      const res = createMockResponse();

      await aiController.chatCompletion(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le role doit être system, user ou assistant'
      );
    });

    it('should handle service errors', async () => {
      const req = createMockRequest({
        body: {
          messages: [{ role: 'user', content: 'Hello' }],
        },
      });
      const res = createMockResponse();
      const error = createMockOpenAIError('Chat error');

      mockService.chatCompletion.mockRejectedValue(error);

      await aiController.chatCompletion(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur lors du chat completion'
      );
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions successfully', async () => {
      const req = createMockRequest({
        body: {
          prompt: 'Generate product names',
          count: 3,
          systemMessage: 'You are a marketing expert',
        },
      });
      const res = createMockResponse();
      const mockSuggestions = createMockSuggestions(3);

      mockService.generateSuggestions.mockResolvedValue(mockSuggestions);

      await aiController.generateSuggestions(req, res);

      expect(mockService.generateSuggestions).toHaveBeenCalledWith(
        'Generate product names',
        3,
        'You are a marketing expert'
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Suggestions générées avec succès',
        {
          suggestions: mockSuggestions,
          count: 3,
          prompt: 'Generate product names',
        }
      );
    });

    it('should use default count when not provided', async () => {
      const req = createMockRequest({
        body: {
          prompt: 'Generate suggestions',
        },
      });
      const res = createMockResponse();
      const mockSuggestions = createMockSuggestions(3);

      mockService.generateSuggestions.mockResolvedValue(mockSuggestions);

      await aiController.generateSuggestions(req, res);

      expect(mockService.generateSuggestions).toHaveBeenCalledWith(
        'Generate suggestions',
        3, // default count
        undefined
      );
    });

    it('should return error if prompt is missing', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await aiController.generateSuggestions(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le prompt est requis'
      );
    });

    it('should return error if count exceeds limit', async () => {
      const req = createMockRequest({
        body: {
          prompt: 'Generate suggestions',
          count: 6,
        },
      });
      const res = createMockResponse();

      await aiController.generateSuggestions(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le nombre de suggestions ne peut pas dépasser 5'
      );
    });

    it('should handle service errors', async () => {
      const req = createMockRequest({
        body: {
          prompt: 'Generate suggestions',
        },
      });
      const res = createMockResponse();
      const error = createMockOpenAIError('Suggestions error');

      mockService.generateSuggestions.mockRejectedValue(error);

      await aiController.generateSuggestions(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur lors de la génération de suggestions'
      );
    });
  });

  describe('improveText', () => {
    it('should improve text successfully', async () => {
      const req = createMockRequest({
        body: {
          text: 'Original text',
          instructions: 'Make it better',
        },
      });
      const res = createMockResponse();
      const improvedText = 'Improved text';

      mockService.improveText.mockResolvedValue(improvedText);

      await aiController.improveText(req, res);

      expect(mockService.improveText).toHaveBeenCalledWith(
        'Original text',
        'Make it better'
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Texte amélioré avec succès',
        {
          originalText: 'Original text',
          improvedText: 'Improved text',
          instructions: 'Make it better',
        }
      );
    });

    it('should use default instructions when not provided', async () => {
      const req = createMockRequest({
        body: {
          text: 'Original text',
        },
      });
      const res = createMockResponse();
      const improvedText = 'Improved text';

      mockService.improveText.mockResolvedValue(improvedText);

      await aiController.improveText(req, res);

      expect(mockService.improveText).toHaveBeenCalledWith(
        'Original text',
        'Améliore ce texte'
      );
    });

    it('should return error if text is missing', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await aiController.improveText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le texte à améliorer est requis'
      );
    });

    it('should handle service errors', async () => {
      const req = createMockRequest({
        body: {
          text: 'Original text',
        },
      });
      const res = createMockResponse();
      const error = createMockOpenAIError('Improve text error');

      mockService.improveText.mockRejectedValue(error);

      await aiController.improveText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur lors de l\'amélioration du texte'
      );
    });
  });

  describe('translateText', () => {
    it('should translate text successfully', async () => {
      const req = createMockRequest({
        body: {
          text: 'Hello world',
          targetLanguage: 'français',
        },
      });
      const res = createMockResponse();
      const translatedText = 'Bonjour le monde';

      mockService.translateText.mockResolvedValue(translatedText);

      await aiController.translateText(req, res);

      expect(mockService.translateText).toHaveBeenCalledWith(
        'Hello world',
        'français'
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Texte traduit avec succès',
        {
          originalText: 'Hello world',
          translatedText: 'Bonjour le monde',
          targetLanguage: 'français',
        }
      );
    });

    it('should use default target language when not provided', async () => {
      const req = createMockRequest({
        body: {
          text: 'Hello world',
        },
      });
      const res = createMockResponse();
      const translatedText = 'Bonjour le monde';

      mockService.translateText.mockResolvedValue(translatedText);

      await aiController.translateText(req, res);

      expect(mockService.translateText).toHaveBeenCalledWith(
        'Hello world',
        'français'
      );
    });

    it('should return error if text is missing', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await aiController.translateText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le texte à traduire est requis'
      );
    });

    it('should handle service errors', async () => {
      const req = createMockRequest({
        body: {
          text: 'Hello world',
        },
      });
      const res = createMockResponse();
      const error = createMockOpenAIError('Translation error');

      mockService.translateText.mockRejectedValue(error);

      await aiController.translateText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur lors de la traduction'
      );
    });
  });

  describe('summarizeText', () => {
    it('should summarize text successfully', async () => {
      const req = createMockRequest({
        body: {
          text: 'Very long text to summarize...',
          maxWords: 50,
        },
      });
      const res = createMockResponse();
      const summary = 'Short summary';

      mockService.summarizeText.mockResolvedValue(summary);

      await aiController.summarizeText(req, res);

      expect(mockService.summarizeText).toHaveBeenCalledWith(
        'Very long text to summarize...',
        50
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Texte résumé avec succès',
        {
          originalText: 'Very long text to summarize...',
          summary: 'Short summary',
          maxWords: 50,
        }
      );
    });

    it('should use default max words when not provided', async () => {
      const req = createMockRequest({
        body: {
          text: 'Text to summarize',
        },
      });
      const res = createMockResponse();
      const summary = 'Summary';

      mockService.summarizeText.mockResolvedValue(summary);

      await aiController.summarizeText(req, res);

      expect(mockService.summarizeText).toHaveBeenCalledWith(
        'Text to summarize',
        100 // default
      );
    });

    it('should return error if text is missing', async () => {
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await aiController.summarizeText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le texte à résumer est requis'
      );
    });

    it('should handle service errors', async () => {
      const req = createMockRequest({
        body: {
          text: 'Text to summarize',
        },
      });
      const res = createMockResponse();
      const error = createMockOpenAIError('Summarization error');

      mockService.summarizeText.mockRejectedValue(error);

      await aiController.summarizeText(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur lors du résumé'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when service is working', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      mockService.generateText.mockResolvedValue('OK test response');

      await aiController.healthCheck(req, res);

      expect(mockService.generateText).toHaveBeenCalledWith({
        prompt: 'Dis juste \'OK\'',
        maxTokens: 10,
      });
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Service AI opérationnel',
        {
          status: 'healthy',
          timestamp: expect.any(String),
          openaiConnected: true,
        }
      );
    });

    it('should return healthy status even if response doesn\'t contain OK', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      mockService.generateText = jest.fn().mockResolvedValue('Different response');
      (AIService as any).prototype.generateText = mockService.generateText;

      await aiController.healthCheck(req, res);

      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Service AI opérationnel',
        expect.objectContaining({
          openaiConnected: false,
        })
      );
    });

    it('should return unhealthy status when service fails', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = createMockOpenAIError('Health check error');

      mockService.generateText.mockRejectedValue(error);

      await aiController.healthCheck(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        503,
        'Service AI non disponible'
      );
    });
  });
});