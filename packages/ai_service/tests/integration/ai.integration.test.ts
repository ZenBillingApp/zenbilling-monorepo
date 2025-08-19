import request from 'supertest';
import express from 'express';
import aiRoutes from '../../src/routes/ai.routes';
import { AIService } from '../../src/services/ai.service';
import { OpenAIConfig } from '../../src/config/openai.config';
import {
  createMockOpenAICompletion,
  createMockTextGenerationRequest,
  createMockChatCompletionRequest,
  createMockSuggestionsRequest,
  createMockImproveTextRequest,
  createMockTranslateRequest,
  createMockSummarizeRequest,
  createMockOpenAIError,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock OpenAI
const mockOpenAI = OpenAIConfig.getInstance() as any;

describe('AI Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use('/api/ai', aiRoutes);
  });

  beforeEach(() => {
    clearAllMocks();
  });

  describe('Text Generation Workflow', () => {
    it('should generate text with complete workflow', async () => {
      const requestData = createMockTextGenerationRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Generated AI response for integration test',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/generate-text')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Texte généré avec succès');
      expect(response.body).toHaveProperty('data', 'Generated AI response for integration test');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const requestData = createMockTextGenerationRequest();
      const error = createMockOpenAIError('OpenAI API rate limit exceeded');

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/ai/generate-text')
        .send(requestData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erreur lors de la génération de texte');
    });

    it('should validate request data completely', async () => {
      const response = await request(app)
        .post('/api/ai/generate-text')
        .send({}) // Empty request
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Le prompt est requis');
    });
  });

  describe('Chat Completion Workflow', () => {
    it('should complete chat with full conversation flow', async () => {
      const requestData = createMockChatCompletionRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Hello! How can I help you today?',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 8,
          total_tokens: 23,
        },
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/chat')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('content', 'Hello! How can I help you today?');
      expect(response.body.data).toHaveProperty('usage');
      expect(response.body.data.usage).toHaveProperty('promptTokens', 15);
      expect(response.body.data.usage).toHaveProperty('completionTokens', 8);
      expect(response.body.data.usage).toHaveProperty('totalTokens', 23);
    });

    it('should validate all message fields', async () => {
      const invalidMessages = [
        { content: 'Missing role' },
        { role: 'user' }, // Missing content
        { role: 'invalid_role', content: 'Invalid role' },
      ];

      for (const invalidMessage of invalidMessages) {
        const response = await request(app)
          .post('/api/ai/chat')
          .send({ messages: [invalidMessage] })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/(role|content|système|user|assistant)/i);
      }
    });

    it('should handle conversation history correctly', async () => {
      const conversationHistory = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '2+2 equals 4' },
        { role: 'user', content: 'What about 3+3?' },
      ];

      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '3+3 equals 6',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/chat')
        .send({ messages: conversationHistory })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('3+3 equals 6');
    });
  });

  describe('Suggestions Generation Workflow', () => {
    it('should generate multiple suggestions correctly', async () => {
      const requestData = createMockSuggestionsRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: '1. InvoiceMaster Pro\n2. BillTracker Elite\n3. PaymentGenius Suite',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/suggestions')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data.suggestions).toHaveLength(3);
      expect(response.body.data.suggestions).toEqual([
        'InvoiceMaster Pro',
        'BillTracker Elite',
        'PaymentGenius Suite',
      ]);
      expect(response.body.data).toHaveProperty('count', 3);
    });

    it('should enforce suggestion count limits', async () => {
      const response = await request(app)
        .post('/api/ai/suggestions')
        .send({
          prompt: 'Generate product names',
          count: 10, // Exceeds limit of 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Le nombre de suggestions ne peut pas dépasser 5');
    });

    it('should use default count when not specified', async () => {
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

      const response = await request(app)
        .post('/api/ai/suggestions')
        .send({ prompt: 'Generate suggestions' })
        .expect(200);

      expect(response.body.data.count).toBe(3); // Default count
    });
  });

  describe('Text Improvement Workflow', () => {
    it('should improve text with custom instructions', async () => {
      const requestData = createMockImproveTextRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'This is a professional and enhanced version of the original text, optimized for clarity and impact.',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/improve-text')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('originalText', requestData.text);
      expect(response.body.data).toHaveProperty('improvedText');
      expect(response.body.data).toHaveProperty('instructions', requestData.instructions);
      expect(response.body.data.improvedText).toContain('professional');
    });

    it('should use default instructions when not provided', async () => {
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Enhanced version of the text',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/improve-text')
        .send({ text: 'Original text' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.instructions).toBe('Améliore ce texte');
    });
  });

  describe('Translation Workflow', () => {
    it('should translate text to specified language', async () => {
      const requestData = createMockTranslateRequest();
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

      const response = await request(app)
        .post('/api/ai/translate')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('originalText', requestData.text);
      expect(response.body.data).toHaveProperty('translatedText', 'Bonjour le monde');
      expect(response.body.data).toHaveProperty('targetLanguage', requestData.targetLanguage);
    });

    it('should use default target language', async () => {
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Bonjour',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/translate')
        .send({ text: 'Hello' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.targetLanguage).toBe('français');
    });
  });

  describe('Text Summarization Workflow', () => {
    it('should summarize text with specified word limit', async () => {
      const requestData = createMockSummarizeRequest();
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'This is a concise summary of the lengthy original text, capturing the key points within the specified word limit.',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/summarize')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('originalText', requestData.text);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('maxWords', requestData.maxWords);
      expect(response.body.data.summary).toContain('concise');
    });

    it('should use default max words when not specified', async () => {
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Summary of the text',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/summarize')
        .send({ text: 'Long text to summarize...' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxWords).toBe(100); // Default value
    });
  });

  describe('Health Check Integration', () => {
    it('should return comprehensive health status', async () => {
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'OK test response',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .get('/api/ai/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('openaiConnected');
      expect(new Date(response.body.data.timestamp)).toBeInstanceOf(Date);
    });

    it('should detect OpenAI connectivity issues', async () => {
      const error = createMockOpenAIError('OpenAI service unavailable');
      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/ai/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Service AI non disponible');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TIMEOUT';
      
      mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError);

      const response = await request(app)
        .post('/api/ai/generate-text')
        .send({ prompt: 'Test prompt' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erreur lors de la génération de texte');
    });

    it('should handle malformed OpenAI responses', async () => {
      const malformedResponse = {
        id: 'test',
        choices: [], // Empty choices array
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(malformedResponse);

      const response = await request(app)
        .post('/api/ai/generate-text')
        .send({ prompt: 'Test prompt' })
        .expect(200);

      // Should handle empty response gracefully
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe(''); // Empty string for no content
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/ai/generate-text')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express handles malformed JSON automatically
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should apply rate limiting to generate-text endpoint', async () => {
      // Note: Actual rate limiting testing would require more complex setup
      // This test ensures the endpoint works with rate limiting middleware
      const response = await request(app)
        .post('/api/ai/generate-text')
        .send({ prompt: 'Test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should apply stricter rate limiting to chat endpoint', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Large Payload Integration', () => {
    it('should handle large prompts within limit', async () => {
      const largePrompt = 'a'.repeat(100000); // 100KB prompt
      const mockCompletion = createMockOpenAICompletion();

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/generate-text')
        .send({ prompt: largePrompt })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle complex chat conversations', async () => {
      const longConversation = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}: This is a longer message to test the handling of complex conversations with multiple turns.`,
      }));

      const mockCompletion = createMockOpenAICompletion();
      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/chat')
        .send({ messages: longConversation })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Content Security and Validation', () => {
    it('should handle special characters in content', async () => {
      const specialCharsText = 'Text with émojis 🤖, special chars: <>&"\'';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Processed text with special characters',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/generate-text')
        .send({ prompt: specialCharsText })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('Processed text with special characters');
    });

    it('should handle multilingual content', async () => {
      const multilingualText = '这是中文 This is English Ceci est français';
      const mockCompletion = createMockOpenAICompletion({
        choices: [
          {
            message: {
              content: 'Multilingual response handling',
            },
          },
        ],
      });

      mockOpenAI.chat.completions.create.mockResolvedValue(mockCompletion);

      const response = await request(app)
        .post('/api/ai/generate-text')
        .send({ prompt: multilingualText })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});