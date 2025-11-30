import { Response } from "express";
import stripeService from "../services/stripe.service";
import { prisma } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";
import { AuthRequest } from "@zenbilling/shared";
import { ApiResponse } from "@zenbilling/shared";
import {
    AccountLinkResponse,
    AccountStatusResponse,
    ConnectAccountResponse,
    CreateAccountLinkRequest,
    CreatePaymentRequest,
    DashboardLinkResponse,
    PaymentResponse,
} from "@zenbilling/shared";
import { IOrganization } from "@zenbilling/shared";

export const createConnectAccount = async (req: AuthRequest, res: Response) => {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: req.organizationId! },
        });

        // Vérifier si l'utilisateur a déjà un compte Stripe Connect
        if (organization?.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'organisation a déjà un compte Stripe Connect"
            );
        }

        // Créer un compte Stripe Connect
        const account = await stripeService.createConnectAccount(
            organization as IOrganization
        );

        // Mettre à jour l'utilisateur avec l'ID du compte Stripe
        await prisma.organization.update({
            where: { id: organization!.id },
            data: { stripe_account_id: account.id },
        });

        const response: ConnectAccountResponse = { accountId: account.id };

        return ApiResponse.success(
            res,
            201,
            "Compte Stripe Connect créé avec succès",
            response
        );
    } catch (error) {
        logger.error(
            { err: error },
            "Erreur lors de la création du compte Stripe Connect"
        );
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la création du compte Stripe Connect"
        );
    }
};

export const createAccountLink = async (req: AuthRequest, res: Response) => {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: req.organizationId },
        });
        const { refreshUrl, returnUrl }: CreateAccountLinkRequest = req.body;

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!organization?.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'organisation n'a pas de compte Stripe Connect"
            );
        }

        // Créer un lien d'onboarding
        const accountLink = await stripeService.createAccountLink(
            organization.stripe_account_id,
            refreshUrl,
            returnUrl
        );

        const response: AccountLinkResponse = { url: accountLink.url };

        return ApiResponse.success(
            res,
            200,
            "Lien d'onboarding créé avec succès",
            response
        );
    } catch (error) {
        logger.error(
            { err: error },
            "Erreur lors de la création du lien Stripe"
        );
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la création du lien Stripe"
        );
    }
};

export const getAccountStatus = async (req: AuthRequest, res: Response) => {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: req.organizationId },
        });

        // Vérifier si l'utilisateur existe
        if (!organization) {
            return ApiResponse.error(res, 404, "Organisation non trouvée");
        }

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!organization.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'organisation n'a pas de compte Stripe Connect"
            );
        }

        // Récupérer les détails du compte
        const account = await stripeService.retrieveConnectAccount(
            organization.stripe_account_id
        );

        // Vérifier si l'onboarding est terminé
        const isOnboarded =
            account.details_submitted && account.payouts_enabled;

        // Mettre à jour le statut d'onboarding dans la base de données si nécessaire
        if (isOnboarded !== organization.stripe_onboarded) {
            await prisma.organization.update({
                where: { id: organization.id },
                data: { stripe_onboarded: isOnboarded },
            });
        }

        const response: AccountStatusResponse = {
            isOnboarded,
            accountId: organization.stripe_account_id,
            details: {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                requirements: account.requirements,
            },
        };

        return ApiResponse.success(
            res,
            200,
            "Statut du compte Stripe récupéré avec succès",
            response
        );
    } catch (error) {
        logger.error(
            { err: error },
            "Erreur lors de la récupération du statut du compte Stripe"
        );
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la récupération du statut du compte Stripe"
        );
    }
};

export const createPayment = async (req: AuthRequest, res: Response) => {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: req.organizationId },
        });
        const { amount, description, invoiceId }: CreatePaymentRequest =
            req.body;

        // Vérifier que tous les champs nécessaires sont présents
        if (!amount || !description || !organization?.id || !invoiceId) {
            return ApiResponse.error(
                res,
                400,
                "Tous les champs sont requis (amount, description, invoiceId)"
            );
        }

        // Vérifier si l'utilisateur existe
        if (!organization) {
            return ApiResponse.error(res, 404, "Organisation non trouvée");
        }

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!organization.stripe_account_id || !organization.stripe_onboarded) {
            return ApiResponse.error(
                res,
                400,
                "L'organisation n'a pas de compte Stripe Connect configuré"
            );
        }

        // Calculer les frais d'application (exemple: 5%)
        const applicationFeeAmount = Math.round(amount * 0.05);

        // Créer l'intention de paiement
        const paymentIntent = await stripeService.createPaymentIntent(
            amount,
            "eur",
            description,
            organization.stripe_account_id,
            applicationFeeAmount
        );

        const response: PaymentResponse = {
            clientSecret: paymentIntent.client_secret || "",
            paymentIntentId: paymentIntent.id,
        };

        return ApiResponse.success(
            res,
            200,
            "Paiement créé avec succès",
            response
        );
    } catch (error) {
        logger.error({ err: error }, "Erreur lors de la création du paiement");
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la création du paiement"
        );
    }
};

export const createCheckoutSession = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const {
            amount,
            currency = "eur",
            description,
            connectedAccountId,
            applicationFeeAmount,
            invoiceId,
            customerEmail,
            successUrl,
            cancelUrl,
        } = req.body;

        // Vérifier que tous les champs nécessaires sont présents
        if (
            !amount ||
            !description ||
            !connectedAccountId ||
            !invoiceId ||
            !customerEmail ||
            !successUrl ||
            !cancelUrl
        ) {
            return ApiResponse.error(
                res,
                400,
                "Tous les champs sont requis (amount, description, connectedAccountId, invoiceId, customerEmail, successUrl, cancelUrl)"
            );
        }

        // Créer la session de paiement Stripe
        const session = await stripeService.createCheckoutSession(
            amount,
            currency,
            description,
            connectedAccountId,
            applicationFeeAmount || Math.round(amount * 0.029), // 2.9% par défaut
            invoiceId,
            customerEmail,
            successUrl,
            cancelUrl
        );

        return ApiResponse.success(
            res,
            200,
            "Session de paiement créée avec succès",
            {
                sessionId: session.id,
                url: session.url,
            }
        );
    } catch (error) {
        logger.error(
            { err: error },
            "Erreur lors de la création de la session de paiement"
        );
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la création de la session de paiement"
        );
    }
};

export const createDashboardLink = async (req: AuthRequest, res: Response) => {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: req.organizationId },
        });

        // Vérifier si l'utilisateur existe
        if (!organization) {
            return ApiResponse.error(res, 404, "Organisation non trouvée");
        }

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!organization.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'organisation n'a pas de compte Stripe Connect"
            );
        }

        // Vérifier si le compte est correctement configuré
        if (!organization.stripe_onboarded) {
            return ApiResponse.error(
                res,
                400,
                "Le compte Stripe Connect n'est pas encore complètement configuré"
            );
        }

        // Générer le lien de connexion au dashboard Stripe
        const loginLink = await stripeService.createLoginLink(
            organization.stripe_account_id
        );

        const response: DashboardLinkResponse = { url: loginLink.url };

        return ApiResponse.success(
            res,
            200,
            "Lien vers le dashboard Stripe généré avec succès",
            response
        );
    } catch (error) {
        logger.error(
            { err: error },
            "Erreur lors de la génération du lien vers le dashboard Stripe"
        );
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la génération du lien vers le dashboard Stripe"
        );
    }
};
