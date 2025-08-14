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

// Mock User data
export const createMockUser = (override: any = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  onboarding_step: 'FINISH',
  stripe_account_id: null,
  stripe_onboarded: false,
  Company: {
    name: 'Test Company',
  },
  created_at: new Date(),
  updated_at: new Date(),
  ...override,
});

// Mock Stripe Account
export const createMockStripeAccount = (override: any = {}) => ({
  id: 'acct_test123',
  object: 'account',
  business_type: 'company',
  capabilities: {
    card_payments: 'active',
    transfers: 'active',
  },
  charges_enabled: true,
  payouts_enabled: true,
  details_submitted: true,
  requirements: {
    currently_due: [],
    errors: [],
    past_due: [],
    pending_verification: [],
  },
  ...override,
});

// Mock Stripe Account Link
export const createMockAccountLink = (override: any = {}) => ({
  object: 'account_link',
  created: Math.floor(Date.now() / 1000),
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  url: 'https://connect.stripe.com/setup/c/test123',
  ...override,
});

// Mock Stripe Payment Intent
export const createMockPaymentIntent = (override: any = {}) => ({
  id: 'pi_test123',
  object: 'payment_intent',
  amount: 10000,
  currency: 'eur',
  client_secret: 'pi_test123_secret',
  status: 'requires_payment_method',
  description: 'Test payment',
  application_fee_amount: 500,
  ...override,
});

// Mock Stripe Transfer
export const createMockTransfer = (override: any = {}) => ({
  id: 'tr_test123',
  object: 'transfer',
  amount: 10000,
  currency: 'eur',
  destination: 'acct_test123',
  description: 'Test transfer',
  created: Math.floor(Date.now() / 1000),
  ...override,
});

// Mock Stripe Checkout Session
export const createMockCheckoutSession = (override: any = {}) => ({
  id: 'cs_test123',
  object: 'checkout.session',
  url: 'https://checkout.stripe.com/pay/cs_test123',
  payment_status: 'unpaid',
  status: 'open',
  mode: 'payment',
  customer_email: 'customer@example.com',
  amount_total: 10000,
  currency: 'eur',
  metadata: {
    invoiceId: 'test-invoice-id',
  },
  ...override,
});

// Mock Stripe Login Link
export const createMockLoginLink = (override: any = {}) => ({
  object: 'login_link',
  created: Math.floor(Date.now() / 1000),
  url: 'https://connect.stripe.com/express/login/acct_test123',
  ...override,
});

// Mock Invoice
export const createMockInvoice = (override: any = {}) => ({
  invoice_id: 'test-invoice-id',
  invoice_number: 'INV-001',
  amount_including_tax: 120.00,
  customer: {
    email: 'customer@example.com',
    individual: {
      first_name: 'Customer',
      last_name: 'Test',
    },
    business: null,
  },
  ...override,
});

// Request data helpers
export const createConnectAccountRequest = () => ({
  // Empty body as the controller gets data from user
});

export const createAccountLinkRequest = (override: any = {}) => ({
  refreshUrl: 'http://localhost:3000/stripe/refresh',
  returnUrl: 'http://localhost:3000/stripe/return',
  ...override,
});

export const createPaymentRequest = (override: any = {}) => ({
  amount: 10000,
  description: 'Test payment',
  invoiceId: 'test-invoice-id',
  ...override,
});

export const createCheckoutSessionRequest = (override: any = {}) => ({
  amount: 10000,
  currency: 'eur',
  description: 'Test checkout session',
  connectedAccountId: 'acct_test123',
  applicationFeeAmount: 290,
  invoiceId: 'test-invoice-id',
  customerEmail: 'customer@example.com',
  successUrl: 'http://localhost:3000/success',
  cancelUrl: 'http://localhost:3000/cancel',
  ...override,
});

// Helper to clear all mocks
export const clearAllMocks = () => {
  jest.clearAllMocks();
};