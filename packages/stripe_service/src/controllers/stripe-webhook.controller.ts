import { Request, Response } from "express";
import dotenv from "dotenv";
import { prisma } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";
import stripe from "../libs/stripe";
import Stripe from "stripe";

dotenv.config();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
    throw new Error(
        "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be defined in environment"
    );
}

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
        return res
            .status(400)
            .json({ success: false, message: "Signature Stripe manquante" });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        logger.error(`Erreur de signature webhook: ${err.message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de signature webhook: ${err.message}`,
        });
    }

    // Traiter les événements
    try {
        switch (event.type) {
            case "account.updated": {
                const account = event.data.object as Stripe.Account;
                await handleAccountUpdated(account);
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentSucceeded(paymentIntent);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentFailed(paymentIntent);
                break;
            }

            default:
                logger.info(`Événement non géré: ${event.type}`);
        }

        return res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error(`Erreur lors du traitement du webhook: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: "Erreur lors du traitement du webhook",
        });
    }
};

/**
 * Gère la mise à jour d'un compte Stripe Connect
 */
async function handleAccountUpdated(account: Stripe.Account) {
    try {
        // Trouver l'utilisateur avec cet ID de compte Stripe
        const organization = await prisma.organization.findFirst({
            where: { stripe_account_id: account.id },
        });

        if (!organization) {
            logger.warn(
                `Organisation non trouvée pour le compte Stripe ${account.id}`
            );
            return;
        }

        // Vérifier si l'onboarding est terminé
        const isOnboarded =
            account.details_submitted && account.payouts_enabled;

        // Mettre à jour le statut d'onboarding
        await prisma.organization.update({
            where: { id: organization.id },
            data: {
                stripe_onboarded: isOnboarded,
            },
        });

        logger.info(
            `Statut Stripe Connect mis à jour pour l'organisation ${organization.id}: ${isOnboarded}`
        );
    } catch (error: any) {
        logger.error(
            `Erreur lors de la mise à jour du compte: ${error.message}`
        );
        throw error;
    }
}

/**
 * Gère un paiement réussi
 */
async function handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
) {
    try {
        // Ici, vous pouvez mettre à jour la facture correspondante comme payée
        // Vous devez stocker l'ID de la facture dans les métadonnées du paymentIntent
        if (paymentIntent.metadata?.invoiceId) {
            const invoiceId = paymentIntent.metadata.invoiceId;

            await prisma.invoice.update({
                where: { invoice_id: invoiceId },
                data: { status: "paid" },
            });

            // Créer un enregistrement de paiement
            await prisma.payment.create({
                data: {
                    invoice_id: invoiceId,
                    payment_date: new Date(),
                    amount: paymentIntent.amount / 100, // Convertir les centimes en euros
                    payment_method: "stripe", // ou un autre type selon votre schéma
                    reference: paymentIntent.id,
                    description: "Paiement Stripe",
                },
            });

            logger.info(`Facture ${invoiceId} marquée comme payée`);
        }
    } catch (error: any) {
        logger.error(
            `Erreur lors du traitement du paiement réussi: ${error.message}`
        );
        throw error;
    }
}

/**
 * Gère un paiement échoué
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
        // Mettre à jour le statut de la facture si nécessaire
        if (paymentIntent.metadata?.invoiceId) {
            const invoiceId = paymentIntent.metadata.invoiceId;

            // Vous pouvez choisir de mettre à jour le statut de la facture ou non
            logger.info(
                `Échec du paiement pour la facture ${invoiceId}: ${
                    paymentIntent.last_payment_error?.message ||
                    "Raison inconnue"
                }`
            );
        }
    } catch (error: any) {
        logger.error(
            `Erreur lors du traitement de l'échec du paiement: ${error.message}`
        );
        throw error;
    }
}
