import { Router } from "express";
import * as stripeController from "../controllers/stripe.controller";
import { handleWebhook } from "../controllers/stripe-webhook.controller";
import { authMiddleware } from "@zenbilling/shared/src/middlewares/auth.middleware";
import express from "express";

const router = Router();

/**
 * @route POST /api/stripe/connect
 * @desc Créer un compte Stripe Connect pour un utilisateur
 * @access Private
 */
router.post("/connect", authMiddleware, stripeController.createConnectAccount);

/**
 * @route POST /api/stripe/account-link
 * @desc Créer un lien d'onboarding pour l'utilisateur
 * @access Private
 */
router.post(
    "/account-link",
    authMiddleware,
    stripeController.createAccountLink
);

/**
 * @route POST /api/stripe/skip-setup
 * @desc Sauter l'étape de configuration Stripe et la reporter à plus tard
 * @access Private
 */
router.post("/skip-setup", authMiddleware, stripeController.skipStripeSetup);

/**
 * @route GET /api/stripe/account-status/:userId
 * @desc Récupérer le statut du compte Stripe Connect
 * @access Private
 */
router.get(
    "/account-status/:userId",
    authMiddleware,
    stripeController.getAccountStatus
);

/**
 * @route POST /api/stripe/create-payment
 * @desc Créer un paiement pour une facture
 * @access Private
 */
router.post("/create-payment", authMiddleware, stripeController.createPayment);

/**
 * @route POST /api/stripe/create-checkout-session
 * @desc Créer une session de paiement Stripe Checkout
 * @access Private
 */
router.post("/create-checkout-session", stripeController.createCheckoutSession);

// /**
//  * @route POST /api/stripe/create-payment-with-email
//  * @desc Créer un paiement pour une facture et envoyer un e-mail avec le lien de paiement
//  * @access Private
//  */
// router.post(
//     "/create-payment-with-email",
//     authMiddleware,
//     stripeController.createPaymentWithEmailLink
// );

/**
//  * @route POST /api/stripe/webhook
//  * @desc Webhook pour les événements Stripe
//  * @access Public
//  */
// router.post(
//     "/webhook",
//     express.raw({ type: "application/json" }),
//     handleWebhook
// );

/**
 * @route GET /api/stripe/dashboard-link
 * @desc Génère un lien d'accès au dashboard Stripe Express de l'utilisateur
 * @access Private
 */
router.get(
    "/dashboard-link",
    authMiddleware,
    stripeController.createDashboardLink
);

export default router;
