import { Request, Response } from 'express';
import { AuthRequest } from '@zenbilling/shared/src/interfaces/Auth.interface';
import { IProduct } from '@zenbilling/shared/src/interfaces/Product.interface';

// Mock AuthRequest
export const createMockAuthRequest = (override: Partial<AuthRequest> = {}): AuthRequest => ({
  user: {
    user_id: 'test-user-id',
    company_id: 'test-company-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    onboarding_completed: true,
    onboarding_step: 'FINISH',
    stripe_onboarded: false,
    stripe_account_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
  body: {},
  params: {},
  query: {},
  headers: {},
  method: 'GET',
  url: '/test',
  ...override,
} as AuthRequest);

// Mock Express Response
export const createMockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Product data
export const createMockProduct = (override: any = {}): any => ({
  product_id: 'test-product-id',
  name: 'Test Product',
  description: 'Test product description',
  price_excluding_tax: 100,
  vat_rate: 'STANDARD',
  unit: 'unite',
  company_id: 'test-company-id',
  created_at: new Date(),
  updated_at: new Date(),
  ...override,
});

// Mock Product request data
export const createMockProductRequest = (override: any = {}) => ({
  name: 'Test Product',
  description: 'Test product description',
  price_excluding_tax: 100,
  vat_rate: 'STANDARD',
  unit: 'unite',
  ...override,
});

// Mock AI response data
export const createMockAIResponse = (override: any = {}) => ({
  description: 'Generated description',
  generatedAt: new Date(),
  productName: 'Test Product',
  ...override,
});

// Mock AI suggestions response
export const createMockAISuggestionsResponse = (override: any = {}) => ({
  suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
  generatedAt: new Date(),
  productName: 'Test Product',
  count: 3,
  ...override,
});

// Helper to clear all mocks
export const clearAllMocks = () => {
  jest.clearAllMocks();
};