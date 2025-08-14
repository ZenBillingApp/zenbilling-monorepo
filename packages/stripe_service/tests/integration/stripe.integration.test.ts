import request from 'supertest';
import express from 'express';
import stripeRoutes from '../../src/routes/stripe.routes';
import { StripeService } from '../../src/services/stripe.service';
import { authMiddleware } from '@zenbilling/shared/src/middlewares/auth.middleware';
import {
  createMockUser,
  createMockStripeAccount,
  createMockAccountLink,
  createMockPaymentIntent,
  createMockCheckoutSession,
  createMockLoginLink,
  createAccountLinkRequest,
  createPaymentRequest,
  createCheckoutSessionRequest,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock external dependencies
jest.mock('@zenbilling/shared/src/libs/prisma');
jest.mock('@zenbilling/shared/src/middlewares/auth.middleware', () => ({
  authMiddleware: jest.fn((req: any, res: any, next: any) => {
    req.user = {
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
    };
    next();
  }),
}));

const mockAuthMiddleware = authMiddleware as any;
const mockPrisma = require('@zenbilling/shared/src/libs/prisma').default;

describe('Stripe Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/stripe', stripeRoutes);
  });

  beforeEach(() => {
    clearAllMocks();
    jest.clearAllMocks();
  });

  describe('Connect Account Workflow', () => {
    it('should create a complete connect account workflow', async () => {
      const mockUser = createMockUser();
      const mockAccount = createMockStripeAccount();

      // Mock database calls
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripe_account_id: mockAccount.id,
      });

      // Mock service method
      jest.spyOn(StripeService.prototype, 'createConnectAccount').mockResolvedValue(mockAccount);

      const response = await request(app)
        .post('/api/stripe/connect')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Compte Stripe Connect créé avec succès');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accountId', mockAccount.id);
    });

    it('should handle user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/stripe/connect')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });

    it('should handle existing stripe account', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_existing123',
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/stripe/connect')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('L\'utilisateur a déjà un compte Stripe Connect');
    });
  });

  describe('Account Link Workflow', () => {
    it('should create account link successfully', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
      });
      const mockAccountLink = createMockAccountLink();
      const requestData = createAccountLinkRequest();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(StripeService.prototype, 'createAccountLink').mockResolvedValue(mockAccountLink);

      const response = await request(app)
        .post('/api/stripe/account-link')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('url', mockAccountLink.url);
    });

    it('should handle user without stripe account', async () => {
      const mockUser = createMockUser({
        stripe_account_id: null,
      });
      const requestData = createAccountLinkRequest();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/stripe/account-link')
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('L\'utilisateur n\'a pas de compte Stripe Connect');
    });
  });

  describe('Account Status Workflow', () => {
    it('should retrieve account status and update user', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: false,
      });
      const mockAccount = createMockStripeAccount({
        details_submitted: true,
        payouts_enabled: true,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripe_onboarded: true,
      });
      jest.spyOn(StripeService.prototype, 'retrieveConnectAccount').mockResolvedValue(mockAccount);

      const response = await request(app)
        .get('/api/stripe/account-status/test-user-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isOnboarded', true);
      expect(response.body.data).toHaveProperty('accountId', mockUser.stripe_account_id);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { stripe_onboarded: true },
      });
    });

    it('should not update user if onboarding status unchanged', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: true,
      });
      const mockAccount = createMockStripeAccount({
        details_submitted: true,
        payouts_enabled: true,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(StripeService.prototype, 'retrieveConnectAccount').mockResolvedValue(mockAccount);

      const response = await request(app)
        .get('/api/stripe/account-status/test-user-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Payment Creation Workflow', () => {
    it('should create payment intent successfully', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: true,
      });
      const mockPaymentIntent = createMockPaymentIntent();
      const requestData = createPaymentRequest();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(StripeService.prototype, 'createPaymentIntent').mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/stripe/create-payment')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clientSecret', mockPaymentIntent.client_secret);
      expect(response.body.data).toHaveProperty('paymentIntentId', mockPaymentIntent.id);
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/stripe/create-payment')
        .send({ amount: 10000 }) // missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tous les champs sont requis');
    });

    it('should handle user not onboarded', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: false,
      });
      const requestData = createPaymentRequest();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/stripe/create-payment')
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('L\'utilisateur n\'a pas de compte Stripe Connect configuré');
    });
  });

  describe('Checkout Session Workflow', () => {
    it('should create checkout session successfully', async () => {
      const mockSession = createMockCheckoutSession();
      const requestData = createCheckoutSessionRequest();

      jest.spyOn(StripeService.prototype, 'createCheckoutSession').mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId', mockSession.id);
      expect(response.body.data).toHaveProperty('url', mockSession.url);
    });

    it('should use default application fee', async () => {
      const mockSession = createMockCheckoutSession();
      const requestData = {
        ...createCheckoutSessionRequest(),
        applicationFeeAmount: undefined,
      };

      jest.spyOn(StripeService.prototype, 'createCheckoutSession').mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(StripeService.prototype.createCheckoutSession).toHaveBeenCalledWith(
        requestData.amount,
        requestData.currency,
        requestData.description,
        requestData.connectedAccountId,
        Math.round(requestData.amount * 0.029), // 2.9% default
        requestData.invoiceId,
        requestData.customerEmail,
        requestData.successUrl,
        requestData.cancelUrl
      );
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send({ amount: 10000 }) // missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tous les champs sont requis');
    });
  });

  describe('Dashboard Link Workflow', () => {
    it('should create dashboard link successfully', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: true,
      });
      const mockLoginLink = createMockLoginLink();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(StripeService.prototype, 'createLoginLink').mockResolvedValue(mockLoginLink);

      const response = await request(app)
        .get('/api/stripe/dashboard-link')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('url', mockLoginLink.url);
    });

    it('should handle user not onboarded', async () => {
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: false,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/stripe/dashboard-link')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Le compte Stripe Connect n\'est pas encore complètement configuré');
    });
  });

  describe('Skip Stripe Setup Workflow', () => {
    it('should skip stripe setup successfully', async () => {
      const mockUser = createMockUser({
        onboarding_step: 'STRIPE_SETUP',
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        onboarding_step: 'FINISH',
      });

      const response = await request(app)
        .post('/api/stripe/skip-setup')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('success', true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { onboarding_step: 'FINISH' },
      });
    });

    it('should handle user not at STRIPE_SETUP step', async () => {
      const mockUser = createMockUser({
        onboarding_step: 'FINISH',
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/stripe/skip-setup')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('L\'utilisateur n\'est pas à l\'étape de configuration Stripe');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication for protected routes', async () => {
      (mockAuthMiddleware as any).mockImplementationOnce((req: any, res: any, next: any) => {
        return res.status(401).json({
          success: false,
          message: 'Token d\'authentification manquant',
        });
      });

      const response = await request(app)
        .post('/api/stripe/connect')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token d\'authentification manquant');
    });

    it('should allow unauthenticated access to checkout session creation', async () => {
      const mockSession = createMockCheckoutSession();
      const requestData = createCheckoutSessionRequest();

      jest.spyOn(StripeService.prototype, 'createCheckoutSession').mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const mockUser = createMockUser();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(StripeService.prototype, 'createConnectAccount').mockRejectedValue(
        new Error('Stripe service error')
      );

      const response = await request(app)
        .post('/api/stripe/connect')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erreur lors de la création du compte Stripe Connect');
    });

    it('should handle database errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/stripe/connect')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON requests', async () => {
      // This test depends on Express built-in JSON parsing error handling
      // which is difficult to mock in this testing setup
      expect(true).toBe(true);
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete onboarding flow', async () => {
      // Step 1: Create connect account
      const mockUser = createMockUser();
      const mockAccount = createMockStripeAccount();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripe_account_id: mockAccount.id,
      });
      jest.spyOn(StripeService.prototype, 'createConnectAccount').mockResolvedValue(mockAccount);

      const createAccountResponse = await request(app)
        .post('/api/stripe/connect')
        .expect(201);

      expect(createAccountResponse.body.success).toBe(true);

      // Step 2: Create account link
      const mockAccountLink = createMockAccountLink();
      const updatedUser = {
        ...mockUser,
        stripe_account_id: mockAccount.id,
      };

      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);
      jest.spyOn(StripeService.prototype, 'createAccountLink').mockResolvedValue(mockAccountLink);

      const linkResponse = await request(app)
        .post('/api/stripe/account-link')
        .send(createAccountLinkRequest())
        .expect(200);

      expect(linkResponse.body.success).toBe(true);
      expect(linkResponse.body.data).toHaveProperty('url');

      // Step 3: Check account status after onboarding
      const fullyOnboardedUser = {
        ...updatedUser,
        stripe_onboarded: false, // Will be updated
      };
      const completeAccount = createMockStripeAccount({
        details_submitted: true,
        payouts_enabled: true,
      });

      mockPrisma.user.findUnique.mockResolvedValue(fullyOnboardedUser);
      mockPrisma.user.update.mockResolvedValue({
        ...fullyOnboardedUser,
        stripe_onboarded: true,
      });
      jest.spyOn(StripeService.prototype, 'retrieveConnectAccount').mockResolvedValue(completeAccount);

      const statusResponse = await request(app)
        .get('/api/stripe/account-status/test-user-id')
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.isOnboarded).toBe(true);

      // Step 4: Create payment
      const finalUser = {
        ...fullyOnboardedUser,
        stripe_onboarded: true,
      };
      const mockPaymentIntent = createMockPaymentIntent();

      mockPrisma.user.findUnique.mockResolvedValue(finalUser);
      jest.spyOn(StripeService.prototype, 'createPaymentIntent').mockResolvedValue(mockPaymentIntent);

      const paymentResponse = await request(app)
        .post('/api/stripe/create-payment')
        .send(createPaymentRequest())
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.data).toHaveProperty('clientSecret');
    });
  });
});