// Mock setup for Jest tests

// Mock Prisma client
jest.mock('@zenbilling/shared/src/libs/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    invoiceItem: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
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

// Mock shared logger export
jest.mock('@zenbilling/shared', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Extend Jest timeout globally
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}