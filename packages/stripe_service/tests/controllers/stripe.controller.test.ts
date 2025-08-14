import * as stripeController from '../../src/controllers/stripe.controller';
import stripeService from '../../src/services/stripe.service';
import prisma from '@zenbilling/shared/src/libs/prisma';
import { ApiResponse } from '@zenbilling/shared/src/utils/apiResponse';
import {
  createMockAuthRequest,
  createMockResponse,
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

// Mock dependencies
jest.mock('../../src/services/stripe.service');
jest.mock('@zenbilling/shared/src/utils/apiResponse');

const mockStripeService = stripeService as any;
const mockPrisma = prisma as any;
const mockApiResponse = ApiResponse as any;

describe('StripeController', () => {
  beforeEach(() => {
    clearAllMocks();
  });

  describe('createConnectAccount', () => {
    it('should create a connect account successfully', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser();
      const mockAccount = createMockStripeAccount();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createConnectAccount.mockResolvedValue(mockAccount);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripe_account_id: mockAccount.id,
      });
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.createConnectAccount(req, res);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: req.user!.id },
        include: { Company: true },
      });
      expect(mockStripeService.createConnectAccount).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.Company.name
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: req.user!.id },
        data: { stripe_account_id: mockAccount.id },
      });
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        201,
        'Compte Stripe Connect créé avec succès',
        { accountId: mockAccount.id }
      );
    });

    it('should return error if user not found', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createConnectAccount(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        404,
        'Utilisateur non trouvé'
      );
    });

    it('should return error if user already has Stripe account', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_existing123',
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createConnectAccount(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'L\'utilisateur a déjà un compte Stripe Connect'
      );
    });

    it('should use user name if no company name available', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({ Company: null });
      const mockAccount = createMockStripeAccount();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createConnectAccount.mockResolvedValue(mockAccount);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripe_account_id: mockAccount.id,
      });
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.createConnectAccount(req, res);

      expect(mockStripeService.createConnectAccount).toHaveBeenCalledWith(
        mockUser.email,
        `${mockUser.first_name} ${mockUser.last_name}`
      );
    });

    it('should handle service errors', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createConnectAccount.mockRejectedValue(
        new Error('Stripe error')
      );
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createConnectAccount(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        500,
        'Erreur lors de la création du compte Stripe Connect'
      );
    });
  });

  describe('createAccountLink', () => {
    it('should create an account link successfully', async () => {
      const req = createMockAuthRequest({
        body: createAccountLinkRequest(),
      });
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
      });
      const mockAccountLink = createMockAccountLink();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createAccountLink.mockResolvedValue(mockAccountLink);
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.createAccountLink(req, res);

      expect(mockStripeService.createAccountLink).toHaveBeenCalledWith(
        mockUser.stripe_account_id,
        req.body.refreshUrl,
        req.body.returnUrl
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Lien d\'onboarding créé avec succès',
        { url: mockAccountLink.url }
      );
    });

    it('should return error if user not found', async () => {
      const req = createMockAuthRequest({
        body: createAccountLinkRequest(),
      });
      const res = createMockResponse();

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createAccountLink(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        404,
        'Utilisateur non trouvé'
      );
    });

    it('should return error if user has no Stripe account', async () => {
      const req = createMockAuthRequest({
        body: createAccountLinkRequest(),
      });
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createAccountLink(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'L\'utilisateur n\'a pas de compte Stripe Connect'
      );
    });
  });

  describe('getAccountStatus', () => {
    it('should get account status successfully', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: false,
      });
      const mockAccount = createMockStripeAccount({
        details_submitted: true,
        payouts_enabled: true,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.retrieveConnectAccount.mockResolvedValue(mockAccount);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        stripe_onboarded: true,
      });
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.getAccountStatus(req, res);

      expect(mockStripeService.retrieveConnectAccount).toHaveBeenCalledWith(
        mockUser.stripe_account_id
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: req.user!.id },
        data: { stripe_onboarded: true },
      });
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Statut du compte Stripe récupéré avec succès',
        expect.objectContaining({
          isOnboarded: true,
          accountId: mockUser.stripe_account_id,
          details: expect.objectContaining({
            chargesEnabled: mockAccount.charges_enabled,
            payoutsEnabled: mockAccount.payouts_enabled,
            detailsSubmitted: mockAccount.details_submitted,
          }),
        })
      );
    });

    it('should not update user if onboarding status is same', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: true,
      });
      const mockAccount = createMockStripeAccount({
        details_submitted: true,
        payouts_enabled: true,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.retrieveConnectAccount.mockResolvedValue(mockAccount);
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.getAccountStatus(req, res);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const req = createMockAuthRequest({
        body: createPaymentRequest(),
      });
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: true,
      });
      const mockPaymentIntent = createMockPaymentIntent();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.createPayment(req, res);

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        req.body.amount,
        'eur',
        req.body.description,
        mockUser.stripe_account_id,
        Math.round(req.body.amount * 0.05)
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Paiement créé avec succès',
        {
          clientSecret: mockPaymentIntent.client_secret,
          paymentIntentId: mockPaymentIntent.id,
        }
      );
    });

    it('should return error if required fields are missing', async () => {
      const req = createMockAuthRequest({
        body: { amount: 10000 }, // missing description and invoiceId
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createPayment(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Tous les champs sont requis (amount, description, invoiceId)'
      );
    });

    it('should return error if user not onboarded', async () => {
      const req = createMockAuthRequest({
        body: createPaymentRequest(),
      });
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: false,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createPayment(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'L\'utilisateur n\'a pas de compte Stripe Connect configuré'
      );
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      const req = createMockAuthRequest({
        body: createCheckoutSessionRequest(),
      });
      const res = createMockResponse();
      const mockSession = createMockCheckoutSession();

      mockStripeService.createCheckoutSession.mockResolvedValue(mockSession);
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.createCheckoutSession(req, res);

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        req.body.amount,
        req.body.currency,
        req.body.description,
        req.body.connectedAccountId,
        req.body.applicationFeeAmount,
        req.body.invoiceId,
        req.body.customerEmail,
        req.body.successUrl,
        req.body.cancelUrl
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Session de paiement créée avec succès',
        {
          sessionId: mockSession.id,
          url: mockSession.url,
        }
      );
    });

    it('should use default application fee if not provided', async () => {
      const req = createMockAuthRequest({
        body: {
          ...createCheckoutSessionRequest(),
          applicationFeeAmount: undefined,
        },
      });
      const res = createMockResponse();
      const mockSession = createMockCheckoutSession();

      mockStripeService.createCheckoutSession.mockResolvedValue(mockSession);
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.createCheckoutSession(req, res);

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        req.body.amount,
        req.body.currency,
        req.body.description,
        req.body.connectedAccountId,
        Math.round(req.body.amount * 0.029), // 2.9% default
        req.body.invoiceId,
        req.body.customerEmail,
        req.body.successUrl,
        req.body.cancelUrl
      );
    });

    it('should return error if required fields are missing', async () => {
      const req = createMockAuthRequest({
        body: { amount: 10000 }, // missing required fields
      });
      const res = createMockResponse();

      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createCheckoutSession(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Tous les champs sont requis (amount, description, connectedAccountId, invoiceId, customerEmail, successUrl, cancelUrl)'
      );
    });
  });

  describe('createDashboardLink', () => {
    it('should create a dashboard link successfully', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: true,
      });
      const mockLoginLink = createMockLoginLink();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createLoginLink.mockResolvedValue(mockLoginLink);
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.createDashboardLink(req, res);

      expect(mockStripeService.createLoginLink).toHaveBeenCalledWith(
        mockUser.stripe_account_id
      );
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Lien vers le dashboard Stripe généré avec succès',
        { url: mockLoginLink.url }
      );
    });

    it('should return error if user not onboarded', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({
        stripe_account_id: 'acct_test123',
        stripe_onboarded: false,
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.createDashboardLink(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'Le compte Stripe Connect n\'est pas encore complètement configuré'
      );
    });
  });

  describe('skipStripeSetup', () => {
    it('should skip stripe setup successfully', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({
        onboarding_step: 'STRIPE_SETUP',
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        onboarding_step: 'FINISH',
      });
      mockApiResponse.success.mockReturnValue(res);

      await stripeController.skipStripeSetup(req, res);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: req.user!.id },
        data: { onboarding_step: 'FINISH' },
      });
      expect(mockApiResponse.success).toHaveBeenCalledWith(
        res,
        200,
        'Configuration Stripe reportée, onboarding terminé',
        {
          success: true,
          message: 'Configuration Stripe reportée avec succès',
        }
      );
    });

    it('should return error if user not at STRIPE_SETUP step', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const mockUser = createMockUser({
        onboarding_step: 'FINISH',
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockApiResponse.error.mockReturnValue(res);

      await stripeController.skipStripeSetup(req, res);

      expect(mockApiResponse.error).toHaveBeenCalledWith(
        res,
        400,
        'L\'utilisateur n\'est pas à l\'étape de configuration Stripe'
      );
    });
  });
});