import { Request, Response } from 'express';
import { AuthRequest } from '@zenbilling/shared/src/interfaces/Auth.interface';

// Mock AuthRequest
export const createMockAuthRequest = (override: Partial<AuthRequest> = {}): AuthRequest => ({
  user: {
    id: 'test-user-id',
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
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Quote data
export const createMockQuote = (override: any = {}): any => ({
  quote_id: 'test-quote-id',
  quote_number: 'DEVIS-123456-202501-001',
  customer_id: 'test-customer-id',
  user_id: 'test-user-id',
  company_id: 'test-company-id',
  quote_date: new Date('2025-01-15'),
  validity_date: new Date('2025-02-15'),
  amount_excluding_tax: 100.00,
  tax: 20.00,
  amount_including_tax: 120.00,
  status: 'draft',
  conditions: 'Conditions de vente standard',
  notes: 'Notes additionnelles',
  created_at: new Date(),
  updated_at: new Date(),
  items: [
    {
      quote_item_id: 'test-item-id',
      product_id: 'test-product-id',
      name: 'Produit test',
      description: 'Description du produit test',
      quantity: 2,
      unit: 'unite',
      unit_price_excluding_tax: 50.00,
      vat_rate: 'STANDARD',
    }
  ],
  customer: {
    customer_id: 'test-customer-id',
    email: 'customer@example.com',
    individual: {
      first_name: 'Jean',
      last_name: 'Dupont',
    },
    business: null,
  },
  company: {
    company_id: 'test-company-id',
    name: 'Entreprise Test',
  },
  user: {
    id: 'test-user-id',
    first_name: 'Test',
    last_name: 'User',
  },
  ...override,
});

// Mock Quote request data
export const createMockQuoteRequest = (override: any = {}) => ({
  customer_id: 'test-customer-id',
  quote_date: new Date('2025-01-15'),
  validity_date: new Date('2025-02-15'),
  conditions: 'Conditions de vente standard',
  notes: 'Notes additionnelles',
  items: [
    {
      product_id: 'test-product-id',
      name: 'Produit test',
      description: 'Description du produit test',
      quantity: 2,
      unit: 'unite',
      unit_price_excluding_tax: 50.00,
      vat_rate: 'STANDARD',
    }
  ],
  ...override,
});

// Mock Product data
export const createMockProduct = (override: any = {}): any => ({
  product_id: 'test-product-id',
  name: 'Produit Test',
  description: 'Description du produit test',
  price_excluding_tax: 50.00,
  vat_rate: 'STANDARD',
  unit: 'unite',
  company_id: 'test-company-id',
  created_at: new Date(),
  updated_at: new Date(),
  ...override,
});

// Mock Customer data
export const createMockCustomer = (override: any = {}): any => ({
  customer_id: 'test-customer-id',
  email: 'customer@example.com',
  phone: '0123456789',
  address: '123 Rue Test',
  company_id: 'test-company-id',
  individual: {
    first_name: 'Jean',
    last_name: 'Dupont',
  },
  business: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...override,
});

// Mock Decimal class
export class MockDecimal {
  private value: number;

  constructor(value: number | string) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }

  times(other: MockDecimal | number): MockDecimal {
    const otherValue = other instanceof MockDecimal ? other.value : other;
    return new MockDecimal(this.value * otherValue);
  }

  plus(other: MockDecimal): MockDecimal {
    return new MockDecimal(this.value + other.value);
  }

  div(other: MockDecimal | number): MockDecimal {
    const otherValue = other instanceof MockDecimal ? other.value : other;
    return new MockDecimal(this.value / otherValue);
  }

  toFixed(digits: number): string {
    return this.value.toFixed(digits);
  }
}

// Helper to clear all mocks
export const clearAllMocks = () => {
  jest.clearAllMocks();
};