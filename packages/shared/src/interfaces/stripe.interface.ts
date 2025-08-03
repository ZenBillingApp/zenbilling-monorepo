import { Stripe } from "stripe";

/**
 * INTERFACES DE REQUÊTE
 */

export interface CreateConnectAccountRequest {
    // Aucun paramètre supplémentaire requis car nous utilisons l'ID de l'utilisateur authentifié
}

export interface CreateAccountLinkRequest {
    refreshUrl: string;
    returnUrl: string;
}

export interface GetAccountStatusRequest {
    // Aucun paramètre supplémentaire requis car nous utilisons l'ID de l'utilisateur authentifié
}

export interface SkipStripeSetupRequest {
    // Aucun paramètre supplémentaire requis car nous utilisons l'ID de l'utilisateur authentifié
}

export interface CreatePaymentRequest {
    amount: number; // Montant en centimes
    description: string; // Description du paiement
    invoiceId: string; // ID de la facture associée
}

export interface CreatePaymentWithEmailRequest extends CreatePaymentRequest {
    successUrl: string; // URL de redirection après paiement réussi
    cancelUrl: string; // URL de redirection en cas d'annulation
}

export interface DashboardLinkRequest {
    // Aucun paramètre supplémentaire requis car nous utilisons l'ID de l'utilisateur authentifié
}

/**
 * INTERFACES DE RÉPONSE
 */

export interface ConnectAccountResponse {
    accountId: string;
}

export interface AccountLinkResponse {
    url: string;
}

export interface SkipStripeSetupResponse {
    success: boolean;
    message: string;
}

export interface AccountStatusResponse {
    isOnboarded: boolean;
    accountId: string;
    details: {
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
        requirements: Stripe.Account.Requirements | undefined;
    };
}

export interface PaymentResponse {
    clientSecret: string;
    paymentIntentId: string;
}

export interface PaymentWithEmailResponse {
    sessionId: string;
    paymentUrl: string;
    emailSent: boolean;
}

export interface DashboardLinkResponse {
    url: string;
}
