import { StripeService } from '../../src/services/stripe.service';
import stripe from '../../src/libs/stripe';
import logger from '@zenbilling/shared/src/utils/logger';
import {
  createMockStripeAccount,
  createMockAccountLink,
  createMockPaymentIntent,
  createMockTransfer,
  createMockCheckoutSession,
  createMockLoginLink,
  clearAllMocks,
} from '../utils/test-helpers';

// Mock Stripe with any type to avoid TypeScript issues
const mockStripe = stripe as any;

describe('StripeService', () => {
  let stripeService: StripeService;

  beforeEach(() => {
    clearAllMocks();
    stripeService = new StripeService();
  });

  describe('createConnectAccount', () => {
    it('should create a connect account successfully', async () => {
      const email = 'test@example.com';
      const businessName = 'Test Business';
      const mockAccount = createMockStripeAccount();

      mockStripe.accounts.create.mockResolvedValue(mockAccount);

      const result = await stripeService.createConnectAccount(email, businessName);

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        email,
        business_type: 'company',
        company: {
          name: businessName,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('should handle errors and log them', async () => {
      const email = 'test@example.com';
      const businessName = 'Test Business';
      const error = new Error('Stripe error');

      mockStripe.accounts.create.mockRejectedValue(error);

      await expect(
        stripeService.createConnectAccount(email, businessName)
      ).rejects.toThrow('Stripe error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating Stripe Connect account:',
        error
      );
    });
  });

  describe('createAccountLink', () => {
    it('should create an account link successfully', async () => {
      const accountId = 'acct_test123';
      const refreshUrl = 'http://localhost/refresh';
      const returnUrl = 'http://localhost/return';
      const mockAccountLink = createMockAccountLink();

      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink);

      const result = await stripeService.createAccountLink(
        accountId,
        refreshUrl,
        returnUrl
      );

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
      expect(result).toEqual(mockAccountLink);
    });

    it('should handle errors and log them', async () => {
      const accountId = 'acct_test123';
      const refreshUrl = 'http://localhost/refresh';
      const returnUrl = 'http://localhost/return';
      const error = new Error('Account link error');

      mockStripe.accountLinks.create.mockRejectedValue(error);

      await expect(
        stripeService.createAccountLink(accountId, refreshUrl, returnUrl)
      ).rejects.toThrow('Account link error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating account link:',
        error
      );
    });
  });

  describe('retrieveConnectAccount', () => {
    it('should retrieve a connect account successfully', async () => {
      const accountId = 'acct_test123';
      const mockAccount = createMockStripeAccount();

      mockStripe.accounts.retrieve.mockResolvedValue(mockAccount);

      const result = await stripeService.retrieveConnectAccount(accountId);

      expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith(accountId);
      expect(result).toEqual(mockAccount);
    });

    it('should handle errors and log them', async () => {
      const accountId = 'acct_test123';
      const error = new Error('Account not found');

      mockStripe.accounts.retrieve.mockRejectedValue(error);

      await expect(
        stripeService.retrieveConnectAccount(accountId)
      ).rejects.toThrow('Account not found');

      expect(logger.error).toHaveBeenCalledWith(
        'Error retrieving Stripe Connect account:',
        error
      );
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const amount = 10000;
      const currency = 'eur';
      const description = 'Test payment';
      const connectedAccountId = 'acct_test123';
      const applicationFeeAmount = 500;
      const mockPaymentIntent = createMockPaymentIntent();

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await stripeService.createPaymentIntent(
        amount,
        currency,
        description,
        connectedAccountId,
        applicationFeeAmount
      );

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        {
          amount,
          currency,
          description,
          application_fee_amount: applicationFeeAmount,
        },
        {
          stripeAccount: connectedAccountId,
        }
      );
      expect(result).toEqual(mockPaymentIntent);
    });

    it('should use default currency when not provided', async () => {
      const amount = 10000;
      const description = 'Test payment';
      const connectedAccountId = 'acct_test123';
      const applicationFeeAmount = 500;
      const mockPaymentIntent = createMockPaymentIntent();

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await stripeService.createPaymentIntent(
        amount,
        undefined,
        description,
        connectedAccountId,
        applicationFeeAmount
      );

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'eur',
        }),
        expect.any(Object)
      );
    });

    it('should handle errors and log them', async () => {
      const amount = 10000;
      const currency = 'eur';
      const description = 'Test payment';
      const connectedAccountId = 'acct_test123';
      const applicationFeeAmount = 500;
      const error = new Error('Payment intent error');

      mockStripe.paymentIntents.create.mockRejectedValue(error);

      await expect(
        stripeService.createPaymentIntent(
          amount,
          currency,
          description,
          connectedAccountId,
          applicationFeeAmount
        )
      ).rejects.toThrow('Payment intent error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating payment intent:',
        error
      );
    });
  });

  describe('createTransfer', () => {
    it('should create a transfer successfully', async () => {
      const amount = 10000;
      const currency = 'eur';
      const destination = 'acct_test123';
      const description = 'Test transfer';
      const mockTransfer = createMockTransfer();

      mockStripe.transfers.create.mockResolvedValue(mockTransfer);

      const result = await stripeService.createTransfer(
        amount,
        currency,
        destination,
        description
      );

      expect(mockStripe.transfers.create).toHaveBeenCalledWith({
        amount,
        currency,
        destination,
        description,
      });
      expect(result).toEqual(mockTransfer);
    });

    it('should use default currency when not provided', async () => {
      const amount = 10000;
      const destination = 'acct_test123';
      const description = 'Test transfer';
      const mockTransfer = createMockTransfer();

      mockStripe.transfers.create.mockResolvedValue(mockTransfer);

      await stripeService.createTransfer(
        amount,
        undefined,
        destination,
        description
      );

      expect(mockStripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'eur',
        })
      );
    });

    it('should handle errors and log them', async () => {
      const amount = 10000;
      const currency = 'eur';
      const destination = 'acct_test123';
      const description = 'Test transfer';
      const error = new Error('Transfer error');

      mockStripe.transfers.create.mockRejectedValue(error);

      await expect(
        stripeService.createTransfer(amount, currency, destination, description)
      ).rejects.toThrow('Transfer error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating transfer:',
        error
      );
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      const amount = 10000;
      const currency = 'eur';
      const description = 'Test checkout';
      const connectedAccountId = 'acct_test123';
      const applicationFeeAmount = 290;
      const invoiceId = 'test-invoice-id';
      const customerEmail = 'customer@example.com';
      const successUrl = 'http://localhost/success';
      const cancelUrl = 'http://localhost/cancel';
      const mockSession = createMockCheckoutSession();

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await stripeService.createCheckoutSession(
        amount,
        currency,
        description,
        connectedAccountId,
        applicationFeeAmount,
        invoiceId,
        customerEmail,
        successUrl,
        cancelUrl
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        {
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency,
                product_data: {
                  name: description,
                },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: customerEmail,
          payment_intent_data: {
            application_fee_amount: applicationFeeAmount,
            metadata: {
              invoiceId: invoiceId,
            },
          },
          metadata: {
            invoiceId: invoiceId,
          },
        },
        {
          stripeAccount: connectedAccountId,
        }
      );
      expect(result).toEqual(mockSession);
    });

    it('should use default currency when not provided', async () => {
      const amount = 10000;
      const description = 'Test checkout';
      const connectedAccountId = 'acct_test123';
      const applicationFeeAmount = 290;
      const invoiceId = 'test-invoice-id';
      const customerEmail = 'customer@example.com';
      const successUrl = 'http://localhost/success';
      const cancelUrl = 'http://localhost/cancel';
      const mockSession = createMockCheckoutSession();

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      await stripeService.createCheckoutSession(
        amount,
        undefined,
        description,
        connectedAccountId,
        applicationFeeAmount,
        invoiceId,
        customerEmail,
        successUrl,
        cancelUrl
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'eur',
              }),
            }),
          ],
        }),
        expect.any(Object)
      );
    });

    it('should handle errors and log them', async () => {
      const amount = 10000;
      const currency = 'eur';
      const description = 'Test checkout';
      const connectedAccountId = 'acct_test123';
      const applicationFeeAmount = 290;
      const invoiceId = 'test-invoice-id';
      const customerEmail = 'customer@example.com';
      const successUrl = 'http://localhost/success';
      const cancelUrl = 'http://localhost/cancel';
      const error = new Error('Checkout session error');

      mockStripe.checkout.sessions.create.mockRejectedValue(error);

      await expect(
        stripeService.createCheckoutSession(
          amount,
          currency,
          description,
          connectedAccountId,
          applicationFeeAmount,
          invoiceId,
          customerEmail,
          successUrl,
          cancelUrl
        )
      ).rejects.toThrow('Checkout session error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating checkout session:',
        error
      );
    });
  });

  describe('createLoginLink', () => {
    it('should create a login link successfully', async () => {
      const accountId = 'acct_test123';
      const mockLoginLink = createMockLoginLink();

      mockStripe.accounts.createLoginLink.mockResolvedValue(mockLoginLink);

      const result = await stripeService.createLoginLink(accountId);

      expect(mockStripe.accounts.createLoginLink).toHaveBeenCalledWith(accountId);
      expect(result).toEqual(mockLoginLink);
    });

    it('should handle errors and log them', async () => {
      const accountId = 'acct_test123';
      const error = new Error('Login link error');

      mockStripe.accounts.createLoginLink.mockRejectedValue(error);

      await expect(
        stripeService.createLoginLink(accountId)
      ).rejects.toThrow('Login link error');

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating Stripe login link:',
        error
      );
    });
  });
});