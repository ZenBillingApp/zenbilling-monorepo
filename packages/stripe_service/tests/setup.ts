// Mock setup for Jest tests

// Mock Prisma client
jest.mock('@zenbilling/shared/src/libs/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      findUnique: jest.fn(),
    },
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

// Mock Stripe library
jest.mock('../src/libs/stripe', () => ({
  __esModule: true,
  default: {
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
      createLoginLink: jest.fn(),
    },
    accountLinks: {
      create: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
    },
    transfers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

// Extend Jest timeout globally
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}