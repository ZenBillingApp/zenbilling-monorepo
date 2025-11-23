import stripe from "../libs/stripe";
import { logger } from "@zenbilling/shared";

export class StripeService {
    /**
     * Crée un compte Connect pour un utilisateur
     * @param email Email de l'utilisateur
     * @param businessName Nom de l'entreprise
     */
    async createConnectAccount(email: string, businessName: string) {
        try {
            const account = await stripe.accounts.create({
                type: "express",
                email,
                business_type: "company",
                company: {
                    name: businessName,
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            return account;
        } catch (error) {
            logger.error({ err: error }, "Error creating Stripe Connect account");
            throw error;
        }
    }

    /**
     * Génère un lien d'intégration pour que l'utilisateur puisse compléter son onboarding Stripe
     * @param accountId ID du compte Stripe Connect
     * @param refreshUrl URL de retour en cas d'échec
     * @param returnUrl URL de retour après succès
     */
    async createAccountLink(
        accountId: string,
        refreshUrl: string,
        returnUrl: string
    ) {
        try {
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: refreshUrl,
                return_url: returnUrl,
                type: "account_onboarding",
            });

            return accountLink;
        } catch (error) {
            logger.error({ err: error }, "Error creating account link");
            throw error;
        }
    }

    /**
     * Récupère les détails d'un compte Connect
     * @param accountId ID du compte Stripe Connect
     */
    async retrieveConnectAccount(accountId: string) {
        try {
            const account = await stripe.accounts.retrieve(accountId);
            return account;
        } catch (error) {
            logger.error({ err: error }, "Error retrieving Stripe Connect account");
            throw error;
        }
    }

    /**
     * Crée un paiement qui sera versé au compte Connect de l'utilisateur
     * @param amount Montant en centimes
     * @param currency Devise (par défaut EUR)
     * @param description Description du paiement
     * @param connectedAccountId ID du compte Stripe Connect du destinataire
     * @param applicationFeeAmount Frais de service prélevés par la plateforme (en centimes)
     */
    async createPaymentIntent(
        amount: number,
        currency: string = "eur",
        description: string,
        connectedAccountId: string,
        applicationFeeAmount: number
    ) {
        try {
            const paymentIntent = await stripe.paymentIntents.create(
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

            return paymentIntent;
        } catch (error) {
            logger.error({ err: error }, "Error creating payment intent");
            throw error;
        }
    }

    /**
     * Effectue un transfert direct vers un compte Connect
     * @param amount Montant en centimes
     * @param currency Devise (par défaut EUR)
     * @param destination ID du compte Stripe Connect destinataire
     * @param description Description du transfert
     */
    async createTransfer(
        amount: number,
        currency: string = "eur",
        destination: string,
        description: string
    ) {
        try {
            const transfer = await stripe.transfers.create({
                amount,
                currency,
                destination,
                description,
            });

            return transfer;
        } catch (error) {
            logger.error({ err: error }, "Error creating transfer");
            throw error;
        }
    }

    /**
     * Crée une session de paiement Stripe qui génère un lien de paiement externe
     * @param amount Montant en centimes
     * @param currency Devise (par défaut EUR)
     * @param description Description du paiement
     * @param connectedAccountId ID du compte Stripe Connect du destinataire
     * @param applicationFeeAmount Frais de service prélevés par la plateforme (en centimes)
     * @param invoiceId ID de la facture associée au paiement
     * @param customerEmail Email du client
     * @param successUrl URL de redirection après paiement réussi
     * @param cancelUrl URL de redirection en cas d'annulation
     */
    async createCheckoutSession(
        amount: number,
        currency: string = "eur",
        description: string,
        connectedAccountId: string,
        applicationFeeAmount: number,
        invoiceId: string,
        customerEmail: string,
        successUrl: string,
        cancelUrl: string
    ) {
        try {
            const session = await stripe.checkout.sessions.create(
                {
                    payment_method_types: ["card"],
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
                    mode: "payment",
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

            return session;
        } catch (error) {
            logger.error({ err: error }, "Error creating checkout session");
            throw error;
        }
    }

    /**
     * Génère un lien d'accès au dashboard Stripe Express pour un utilisateur
     * @param accountId ID du compte Stripe Connect de l'utilisateur
     * @returns Un lien URL permettant d'accéder directement au dashboard Stripe
     */
    async createLoginLink(accountId: string) {
        try {
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            return loginLink;
        } catch (error) {
            logger.error({ err: error }, "Error creating Stripe login link");
            throw error;
        }
    }
}

export default new StripeService();
