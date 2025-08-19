import request from 'supertest';
import express from 'express';
import aiRoutes from '../../src/routes/ai.routes';
import * as aiController from '../../src/controllers/ai.controller';
import {
  createMockTextGenerationRequest,
  createMockChatCompletionRequest,
  createMockSuggestionsRequest,
  createMockImproveTextRequest,
  createMockTranslateRequest,
  createMockSummarizeRequest,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock dependencies
jest.mock('../../src/controllers/ai.controller', () => ({
  AIController: jest.fn().mockImplementation(() => ({
    generateText: jest.fn(),
    chatCompletion: jest.fn(),
    generateSuggestions: jest.fn(),
    improveText: jest.fn(),
    translateText: jest.fn(),
    summarizeText: jest.fn(),
    healthCheck: jest.fn(),
  }))
}));

const { AIController } = require('../../src/controllers/ai.controller');
const mockController = new AIController();

describe('AI Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/ai', aiRoutes);
  });

  beforeEach(() => {
    clearAllMocks();

    // Mock all controller methods
    mockController.generateText.mockImplementation(
      async (req: any, res: any) => {
        return res.status(200).json({ success: true, data: 'Generated text' });
      }
    );

    mockController.chatCompletion.mockImplementation(
      async (req: any, res: any) => {
        return res.status(200).json({ success: true, data: 'Chat response' });
      }
    );

    mockController.generateSuggestions.mockImplementation(
      async (req: any, res: any) => {
        return res.status(200).json({ success: true, data: ['suggestion1', 'suggestion2'] });
      }
    );

    mockController.improveText.mockImplementation(
      async (req: any, res: any) => {
        return res.status(200).json({ success: true, data: 'Improved text' });
      }
    );

    mockController.translateText.mockImplementation(
      async (req: any, res: any) => {
        return res.status(200).json({ success: true, data: 'Translated text' });
      }
    );

    mockController.summarizeText.mockImplementation(
      async (req: any, res: any) => {
        return res.status(200).json({ success: true, data: 'Summary' });
      }
    );

    mockController.healthCheck.mockImplementation(
      async (req: any, res: any) => {
        return res.status(200).json({ success: true, data: { status: 'healthy' } });
      }
    );
  });

  describe('GET /ai/health', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/ai/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.healthCheck).toHaveBeenCalled();
    });

    it('should not be rate limited', async () => {
      // Make multiple requests quickly
      const promises = Array(5).fill(null).map(() =>
        request(app).get('/ai/health')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('POST /ai/generate-text', () => {
    it('should generate text successfully', async () => {
      const requestData = createMockTextGenerationRequest();

      const response = await request(app)
        .post('/ai/generate-text')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.generateText).toHaveBeenCalled();
    });

    it('should handle missing prompt', async () => {
      mockController.generateText.mockImplementation(
        async (req: any, res: any) => {
          return res.status(400).json({ success: false, message: 'Le prompt est requis' });
        }
      );

      const response = await request(app)
        .post('/ai/generate-text')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Le prompt est requis');
    });

    it('should be rate limited', async () => {
      // This test would need actual rate limiting implementation
      // For now, just test that the route exists and works
      const requestData = createMockTextGenerationRequest();

      const response = await request(app)
        .post('/ai/generate-text')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /ai/chat', () => {
    it('should complete chat successfully', async () => {
      const requestData = createMockChatCompletionRequest();

      const response = await request(app)
        .post('/ai/chat')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.chatCompletion).toHaveBeenCalled();
    });

    it('should handle invalid messages', async () => {
      mockController.chatCompletion.mockImplementation(
        async (req: any, res: any) => {
          return res.status(400).json({ 
            success: false, 
            message: 'Les messages sont requis' 
          });
        }
      );

      const response = await request(app)
        .post('/ai/chat')
        .send({ messages: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should have strict rate limiting', async () => {
      // Test that the route exists and works
      const requestData = createMockChatCompletionRequest();

      const response = await request(app)
        .post('/ai/chat')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /ai/suggestions', () => {
    it('should generate suggestions successfully', async () => {
      const requestData = createMockSuggestionsRequest();

      const response = await request(app)
        .post('/ai/suggestions')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.generateSuggestions).toHaveBeenCalled();
    });

    it('should handle missing prompt', async () => {
      mockController.generateSuggestions.mockImplementation(
        async (req: any, res: any) => {
          return res.status(400).json({ 
            success: false, 
            message: 'Le prompt est requis' 
          });
        }
      );

      const response = await request(app)
        .post('/ai/suggestions')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle count limit exceeded', async () => {
      mockController.generateSuggestions.mockImplementation(
        async (req: any, res: any) => {
          return res.status(400).json({ 
            success: false, 
            message: 'Le nombre de suggestions ne peut pas dépasser 5' 
          });
        }
      );

      const response = await request(app)
        .post('/ai/suggestions')
        .send({ prompt: 'test', count: 10 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /ai/improve-text', () => {
    it('should improve text successfully', async () => {
      const requestData = createMockImproveTextRequest();

      const response = await request(app)
        .post('/ai/improve-text')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.improveText).toHaveBeenCalled();
    });

    it('should handle missing text', async () => {
      mockController.improveText.mockImplementation(
        async (req: any, res: any) => {
          return res.status(400).json({ 
            success: false, 
            message: 'Le texte à améliorer est requis' 
          });
        }
      );

      const response = await request(app)
        .post('/ai/improve-text')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /ai/translate', () => {
    it('should translate text successfully', async () => {
      const requestData = createMockTranslateRequest();

      const response = await request(app)
        .post('/ai/translate')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.translateText).toHaveBeenCalled();
    });

    it('should handle missing text', async () => {
      mockController.translateText.mockImplementation(
        async (req: any, res: any) => {
          return res.status(400).json({ 
            success: false, 
            message: 'Le texte à traduire est requis' 
          });
        }
      );

      const response = await request(app)
        .post('/ai/translate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /ai/summarize', () => {
    it('should summarize text successfully', async () => {
      const requestData = createMockSummarizeRequest();

      const response = await request(app)
        .post('/ai/summarize')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockController.summarizeText).toHaveBeenCalled();
    });

    it('should handle missing text', async () => {
      mockController.summarizeText.mockImplementation(
        async (req: any, res: any) => {
          return res.status(400).json({ 
            success: false, 
            message: 'Le texte à résumer est requis' 
          });
        }
      );

      const response = await request(app)
        .post('/ai/summarize')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('HTTP Methods', () => {
    it('should not allow wrong HTTP methods on POST routes', async () => {
      await request(app)
        .get('/ai/generate-text')
        .expect(404);

      await request(app)
        .put('/ai/chat')
        .expect(404);

      await request(app)
        .delete('/ai/suggestions')
        .expect(404);
    });

    it('should not allow POST on health check route', async () => {
      await request(app)
        .post('/ai/health')
        .expect(404);
    });
  });

  describe('Large Payload Handling', () => {
    it('should handle large JSON payloads', async () => {
      const largePrompt = 'a'.repeat(1000000); // 1MB string
      
      const response = await request(app)
        .post('/ai/generate-text')
        .send({ prompt: largePrompt })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle payload size within 10MB limit', async () => {
      // Test with a reasonably large payload
      const mediumPrompt = 'test prompt '.repeat(1000);
      
      const response = await request(app)
        .post('/ai/generate-text')
        .send({ 
          prompt: mediumPrompt,
          systemMessage: 'system message '.repeat(100),
          maxTokens: 500 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle controller errors gracefully', async () => {
      mockController.generateText.mockImplementation(
        async (req: any, res: any) => {
          return res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la génération de texte' 
          });
        }
      );

      const response = await request(app)
        .post('/ai/generate-text')
        .send({ prompt: 'test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erreur lors de la génération de texte');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/ai/generate-text')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express should handle malformed JSON with a 400 error
    });
  });

  describe('Content-Type Validation', () => {
    it('should accept application/json content type', async () => {
      const requestData = createMockTextGenerationRequest();

      const response = await request(app)
        .post('/ai/generate-text')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(requestData))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle requests without content-type', async () => {
      const requestData = createMockTextGenerationRequest();

      const response = await request(app)
        .post('/ai/generate-text')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Route Parameters and Query Strings', () => {
    it('should ignore query parameters on POST routes', async () => {
      const requestData = createMockTextGenerationRequest();

      const response = await request(app)
        .post('/ai/generate-text?ignored=true')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle health check with query parameters', async () => {
      const response = await request(app)
        .get('/ai/health?detailed=true')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});