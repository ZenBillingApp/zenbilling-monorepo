import { Request, Response } from 'express';
import {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  TextGenerationRequest,
} from '@zenbilling/shared/src/interfaces/AI.interface';

// Mock data creators
export const createMockRequest = (override: Partial<Request> = {}): Request => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...override,
} as Request);

export const createMockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockTextGenerationRequest = (
  override: Partial<TextGenerationRequest> = {}
): TextGenerationRequest => ({
  prompt: 'Test prompt',
  systemMessage: 'You are a helpful assistant',
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.7,
  ...override,
});

export const createMockChatCompletionRequest = (
  override: Partial<ChatCompletionRequest> = {}
): ChatCompletionRequest => ({
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello' },
  ],
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.7,
  ...override,
});

export const createMockChatMessage = (
  override: Partial<ChatMessage> = {}
): ChatMessage => ({
  role: 'user',
  content: 'Test message',
  ...override,
});

export const createMockOpenAICompletion = (override: any = {}) => ({
  id: 'chatcmpl-test123',
  object: 'chat.completion',
  created: Date.now(),
  model: 'gpt-3.5-turbo',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'Test response',
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 5,
    total_tokens: 15,
  },
  ...override,
});

export const createMockChatCompletionResponse = (
  override: Partial<ChatCompletionResponse> = {}
): ChatCompletionResponse => ({
  content: 'Test AI response',
  usage: {
    promptTokens: 10,
    completionTokens: 5,
    totalTokens: 15,
  },
  model: 'gpt-3.5-turbo',
  finishReason: 'stop',
  ...override,
});

// Mock test data
export const createMockSuggestions = (count: number = 3): string[] => {
  return Array.from({ length: count }, (_, i) => `Suggestion ${i + 1}`);
};

export const createMockImproveTextRequest = () => ({
  text: 'This is a text to improve',
  instructions: 'Make it more professional',
});

export const createMockTranslateRequest = () => ({
  text: 'Hello world',
  targetLanguage: 'français',
});

export const createMockSummarizeRequest = () => ({
  text: 'This is a very long text that needs to be summarized. It contains many details and information that could be condensed into a shorter version.',
  maxWords: 50,
});

export const createMockSuggestionsRequest = () => ({
  prompt: 'Generate product names for a billing software',
  count: 3,
  systemMessage: 'You are a marketing expert',
});

// Utility function to clear all mocks
export const clearAllMocks = (): void => {
  jest.clearAllMocks();
};

// Mock OpenAI error
export const createMockOpenAIError = (message: string = 'OpenAI API error') => {
  const error = new Error(message);
  error.name = 'OpenAIError';
  return error;
};

// Rate limit mock data
export const createMockRateLimitError = () => ({
  success: false,
  message: 'Trop de requêtes AI. Veuillez réessayer plus tard.',
  error: 'RATE_LIMIT_EXCEEDED',
});

// Health check mock data
export const createMockHealthCheckResponse = () => ({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  openaiConnected: true,
});

// Mock request with rate limit headers
export const createMockRateLimitHeaders = () => ({
  'x-ratelimit-limit': '100',
  'x-ratelimit-remaining': '99',
  'x-ratelimit-reset': (Date.now() + 900000).toString(), // 15 minutes from now
});

// Mock Express app for testing routes
export const createMockApp = () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    listen: jest.fn(),
  };
  return mockApp;
};

export default {
  createMockRequest,
  createMockResponse,
  createMockTextGenerationRequest,
  createMockChatCompletionRequest,
  createMockChatMessage,
  createMockOpenAICompletion,
  createMockChatCompletionResponse,
  createMockSuggestions,
  createMockImproveTextRequest,
  createMockTranslateRequest,
  createMockSummarizeRequest,
  createMockSuggestionsRequest,
  clearAllMocks,
  createMockOpenAIError,
  createMockRateLimitError,
  createMockHealthCheckResponse,
  createMockRateLimitHeaders,
  createMockApp,
};