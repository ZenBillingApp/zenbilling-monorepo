// Mock setup for Jest tests

// Mock OpenAI
jest.mock('../src/config/openai.config', () => ({
  OpenAIConfig: {
    getInstance: jest.fn().mockReturnValue({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    }),
    getModel: jest.fn().mockReturnValue('gpt-3.5-turbo'),
    getMaxTokens: jest.fn().mockReturnValue(500),
    getTemperature: jest.fn().mockReturnValue(0.7),
  },
}));

// Mock logger
jest.mock('@zenbilling/shared/src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock API Response
jest.mock('@zenbilling/shared/src/utils/apiResponse', () => ({
  ApiResponse: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Extend Jest timeout globally
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}