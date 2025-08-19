import { AIService } from '../../src/services/ai.service';
import { OpenAIConfig } from '../../src/config/openai.config';
import {
  createMockTextGenerationRequest,
  createMockChatCompletionRequest,
  createMockOpenAICompletion,
  createMockOpenAIError,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock OpenAI with any type to avoid TypeScript issues
const mockOpenAI = OpenAIConfig.getInstance() as any;

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    clearAllMocks();
    aiService = new AIService();
  });

  describe('generateText', () => {
    it('should generate text successfully', async () => {
      const request = createMockTextGenerationRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Generated text response',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateText(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: request.model,
        messages: [
          { role: 'system', content: request.systemMessage },
          { role: 'user', content: request.prompt },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      });
      expect(result).toBe('Generated text response');
    });

    it('should generate text without system message', async () => {
      const request = createMockTextGenerationRequest({
        systemMessage: undefined,
      });
      const mockCompletion = createMockOpenAICompletion();

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.generateText(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: request.model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      });
    });

    it('should use default values when not provided', async () => {
      const request = createMockTextGenerationRequest({
        model: undefined,
        maxTokens: undefined,
        temperature: undefined,
      });
      const mockCompletion = createMockOpenAICompletion();

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.generateText(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo', // default from config
        messages: expect.any(Array),
        max_tokens: 500, // default from config
        temperature: 0.7, // default from config
      });
    });

    it('should handle empty response content', async () => {
      const request = createMockTextGenerationRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateText(request);

      expect(result).toBe('');
    });

    it('should handle errors and throw custom message', async () => {
      const request = createMockTextGenerationRequest();
      const error = createMockOpenAIError('API error');

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(aiService.generateText(request)).rejects.toThrow(
        'Impossible de générer le texte'
      );
    });

    it('should trim whitespace from response', async () => {
      const request = createMockTextGenerationRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '   Generated text with whitespace   ',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateText(request);

      expect(result).toBe('Generated text with whitespace');
    });
  });

  describe('chatCompletion', () => {
    it('should complete chat successfully', async () => {
      const request = createMockChatCompletionRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Chat completion response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 10,
          total_tokens: 30,
        },
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.chatCompletion(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: request.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      });

      expect(result).toEqual({
        content: 'Chat completion response',
        usage: {
          promptTokens: 20,
          completionTokens: 10,
          totalTokens: 30,
        },
        model: mockCompletion.model,
        finishReason: 'stop',
      });
    });

    it('should handle chat completion without usage data', async () => {
      const request = createMockChatCompletionRequest();
      const mockCompletion = createMockOpenAICompletion({
        usage: undefined,
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.chatCompletion(request);

      expect(result.usage).toBeUndefined();
    });

    it('should handle errors and throw custom message', async () => {
      const request = createMockChatCompletionRequest();
      const error = createMockOpenAIError('Chat API error');

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(aiService.chatCompletion(request)).rejects.toThrow(
        'Impossible de traiter la demande de chat'
      );
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions successfully', async () => {
      const prompt = 'Generate product names';
      const count = 3;
      const systemMessage = 'You are a marketing expert';
      
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '1. BillMaster\n2. InvoiceGenius\n3. PaymentPro',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateSuggestions(
        prompt,
        count,
        systemMessage
      );

      expect(result).toEqual(['BillMaster', 'InvoiceGenius', 'PaymentPro']);
      expect(result).toHaveLength(3);
    });

    it('should use default count when not provided', async () => {
      const prompt = 'Generate suggestions';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '1. Suggestion One\n2. Suggestion Two\n3. Suggestion Three',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateSuggestions(prompt);

      expect(result).toHaveLength(3); // default count
    });

    it('should handle malformed suggestions content', async () => {
      const prompt = 'Generate suggestions';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Suggestion without numbering\nAnother suggestion\nThird one',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateSuggestions(prompt, 3);

      expect(result).toEqual([
        'Suggestion without numbering',
        'Another suggestion',
        'Third one',
      ]);
    });

    it('should limit suggestions to requested count', async () => {
      const prompt = 'Generate suggestions';
      const count = 2;
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '1. First\n2. Second\n3. Third\n4. Fourth\n5. Fifth',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateSuggestions(prompt, count);

      expect(result).toHaveLength(2);
      expect(result).toEqual(['First', 'Second']);
    });

    it('should handle errors and throw custom message', async () => {
      const prompt = 'Generate suggestions';
      const error = createMockOpenAIError('Suggestions API error');

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(aiService.generateSuggestions(prompt)).rejects.toThrow(
        'Impossible de générer les suggestions'
      );
    });
  });

  describe('improveText', () => {
    it('should improve text successfully', async () => {
      const text = 'Original text';
      const instructions = 'Make it better';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Improved version of the text',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.improveText(text, instructions);

      expect(result).toBe('Improved version of the text');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'system',
              content:
                'Tu es un assistant spécialisé dans l\'amélioration de textes. Fournis une version améliorée claire et professionnelle.',
            },
            {
              role: 'user',
              content: `${instructions}\n\nTexte original : "${text}"`,
            },
          ],
        })
      );
    });

    it('should use default instructions when not provided', async () => {
      const text = 'Original text';
      const mockCompletion = createMockOpenAICompletion();

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.improveText(text);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Améliore ce texte'),
            }),
          ]),
        })
      );
    });

    it('should handle errors and throw custom message', async () => {
      const text = 'Original text';
      const error = createMockOpenAIError('Improve text API error');

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(aiService.improveText(text)).rejects.toThrow(
        'Impossible d\'améliorer le texte'
      );
    });
  });

  describe('translateText', () => {
    it('should translate text successfully', async () => {
      const text = 'Hello world';
      const targetLanguage = 'français';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Bonjour le monde',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.translateText(text, targetLanguage);

      expect(result).toBe('Bonjour le monde');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'system',
              content: `Tu es un traducteur professionnel. Traduis le texte en ${targetLanguage} en gardant le sens et le ton original.`,
            },
            {
              role: 'user',
              content: `Traduis ce texte en ${targetLanguage} : "${text}"`,
            },
          ],
        })
      );
    });

    it('should use default target language when not provided', async () => {
      const text = 'Hello world';
      const mockCompletion = createMockOpenAICompletion();

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.translateText(text);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('français'),
            }),
          ]),
        })
      );
    });

    it('should handle errors and throw custom message', async () => {
      const text = 'Hello world';
      const error = createMockOpenAIError('Translation API error');

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(aiService.translateText(text)).rejects.toThrow(
        'Impossible de traduire le texte'
      );
    });
  });

  describe('summarizeText', () => {
    it('should summarize text successfully', async () => {
      const text = 'This is a very long text that needs summarization...';
      const maxWords = 50;
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'This is a summary of the long text.',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.summarizeText(text, maxWords);

      expect(result).toBe('This is a summary of the long text.');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'system',
              content:
                'Tu es spécialisé dans la création de résumés concis et précis.',
            },
            {
              role: 'user',
              content: `Résume ce texte en maximum ${maxWords} mots : "${text}"`,
            },
          ],
        })
      );
    });

    it('should use default max words when not provided', async () => {
      const text = 'Long text to summarize';
      const mockCompletion = createMockOpenAICompletion();

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      await aiService.summarizeText(text);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('100 mots'), // default max words
            }),
          ]),
        })
      );
    });

    it('should handle errors and throw custom message', async () => {
      const text = 'Text to summarize';
      const error = createMockOpenAIError('Summarization API error');

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(aiService.summarizeText(text)).rejects.toThrow(
        'Impossible de résumer le texte'
      );
    });
  });

  describe('parseSuggestions', () => {
    it('should parse numbered suggestions correctly', async () => {
      const prompt = 'Test prompt';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '1. First suggestion\n2. Second suggestion\n3. Third suggestion',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateSuggestions(prompt, 3);

      expect(result).toEqual([
        'First suggestion',
        'Second suggestion',
        'Third suggestion',
      ]);
    });

    it('should handle mixed formatting in suggestions', async () => {
      const prompt = 'Test prompt';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '1. First\n\n2.    Second with spaces   \n3.Third\nFourth without number',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const result = await aiService.generateSuggestions(prompt, 4);

      expect(result).toEqual(['First', 'Second with spaces', 'Third', 'Fourth without number']);
    });
  });
});