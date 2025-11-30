import { Router } from "express";
import * as stripeController from "../controllers/stripe.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";
import express from "express";
import { handleWebhook } from "../controllers/stripe-webhook.controller";

const router = Router();

router.use(authMiddleware);

/**
 * @route POST /api/stripe/connect
 * @desc Créer un compte Stripe Connect pour un utilisateur
 * @access Private
 */
router.post(
    "/connect",
    organizationRequired,
    stripeController.createConnectAccount
);

/**
 * @route POST /api/stripe/account-link
 * @desc Créer un lien d'onboarding pour l'utilisateur
 * @access Private
 */
router.post(
    "/account-link",
    organizationRequired,
    stripeController.createAccountLink
);

/**
 * @route GET /api/stripe/account-status/:userId
 * @desc Récupérer le statut du compte Stripe Connect
 * @access Private
 */
router.get(
    "/account-status",
    organizationRequired,
    stripeController.getAccountStatus
);

/**
 * @route POST /api/stripe/create-payment
 * @desc Créer un paiement pour une facture
 * @access Private
 */
router.post(
    "/create-payment",
    organizationRequired,
    stripeController.createPayment
);

/**
 * @route POST /api/stripe/create-checkout-session
 * @desc Créer une session de paiement Stripe Checkout
 * @access Private
 */
router.post("/create-checkout-session", stripeController.createCheckoutSession);

/**
 * @route POST /api/stripe/webhook
 * @desc Webhook pour les événements Stripe
 * @access Public
 */
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
);

/**
 * @route GET /api/stripe/dashboard-link
 * @desc Génère un lien d'accès au dashboard Stripe Express de l'utilisateur
 * @access Private
 */
router.get(
    "/dashboard-link",
    organizationRequired,
    stripeController.createDashboardLink
);

export default router;
