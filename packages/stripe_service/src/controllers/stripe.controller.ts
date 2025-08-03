import { Response } from "express";
import stripeService from "../services/stripe.service";
import prisma from "@zenbilling/shared/src/libs/prisma";
import logger from "@zenbilling/shared/src/utils/logger";
import { AuthRequest } from "@zenbilling/shared/src/interfaces/Auth.interface";
import { ApiResponse } from "@zenbilling/shared/src/utils/apiResponse";
import {
    AccountLinkResponse,
    AccountStatusResponse,
    ConnectAccountResponse,
    CreateAccountLinkRequest,
    CreatePaymentRequest,
    CreatePaymentWithEmailRequest,
    DashboardLinkResponse,
    PaymentResponse,
    PaymentWithEmailResponse,
    SkipStripeSetupResponse,
} from "@zenbilling/shared/src/interfaces/stripe.interface";

export const createConnectAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { Company: true },
        });

        if (!user) {
            return ApiResponse.error(res, 404, "Utilisateur non trouvé");
        }

        // Vérifier si l'utilisateur a déjà un compte Stripe Connect
        if (user.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'utilisateur a déjà un compte Stripe Connect"
            );
        }

        // Créer un compte Stripe Connect
        const businessName =
            user.Company?.name || `${user.first_name} ${user.last_name}`;
        const account = await stripeService.createConnectAccount(
            user.email,
            businessName
        );

        // Mettre à jour l'utilisateur avec l'ID du compte Stripe
        await prisma.user.update({
            where: { id: userId },
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
        console.log(error);
        logger.error(
            "Erreur lors de la création du compte Stripe Connect:",
            error
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
        const userId = req.user?.id;
        const { refreshUrl, returnUrl }: CreateAccountLinkRequest = req.body;

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return ApiResponse.error(res, 404, "Utilisateur non trouvé");
        }

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!user.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'utilisateur n'a pas de compte Stripe Connect"
            );
        }

        // Créer un lien d'onboarding
        const accountLink = await stripeService.createAccountLink(
            user.stripe_account_id,
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
        logger.error("Erreur lors de la création du lien Stripe:", error);
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la création du lien Stripe"
        );
    }
};

export const getAccountStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { Company: true },
        });

        if (!user) {
            return ApiResponse.error(res, 404, "Utilisateur non trouvé");
        }

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!user.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'utilisateur n'a pas de compte Stripe Connect"
            );
        }

        // Récupérer les détails du compte
        const account = await stripeService.retrieveConnectAccount(
            user.stripe_account_id
        );

        // Vérifier si l'onboarding est terminé
        const isOnboarded =
            account.details_submitted && account.payouts_enabled;

        // Mettre à jour le statut d'onboarding dans la base de données si nécessaire
        if (isOnboarded !== user.stripe_onboarded) {
            await prisma.user.update({
                where: { id: userId },
                data: { stripe_onboarded: isOnboarded },
            });
        }

        const response: AccountStatusResponse = {
            isOnboarded,
            accountId: user.stripe_account_id,
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
            "Erreur lors de la récupération du statut du compte Stripe:",
            error
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
        const userId = req.user?.id;
        const { amount, description, invoiceId }: CreatePaymentRequest =
            req.body;

        // Vérifier que tous les champs nécessaires sont présents
        if (!amount || !description || !userId || !invoiceId) {
            return ApiResponse.error(
                res,
                400,
                "Tous les champs sont requis (amount, description, invoiceId)"
            );
        }

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return ApiResponse.error(res, 404, "Utilisateur non trouvé");
        }

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!user.stripe_account_id || !user.stripe_onboarded) {
            return ApiResponse.error(
                res,
                400,
                "L'utilisateur n'a pas de compte Stripe Connect configuré"
            );
        }

        // Calculer les frais d'application (exemple: 5%)
        const applicationFeeAmount = Math.round(amount * 0.05);

        // Créer l'intention de paiement
        const paymentIntent = await stripeService.createPaymentIntent(
            amount,
            "eur",
            description,
            user.stripe_account_id,
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
        logger.error("Erreur lors de la création du paiement:", error);
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la création du paiement"
        );
    }
};

// export const createPaymentWithEmailLink = async (
//     req: AuthRequest,
//     res: Response
// ) => {
//     try {
//         const userId = req.user?.id;
//         const {
//             amount,
//             description,
//             invoiceId,
//             successUrl,
//             cancelUrl,
//         }: CreatePaymentWithEmailRequest = req.body;

//         // Vérifier que tous les champs nécessaires sont présents
//         if (
//             !amount ||
//             !description ||
//             !userId ||
//             !invoiceId ||
//             !successUrl ||
//             !cancelUrl
//         ) {
//             return ApiResponse.error(
//                 res,
//                 400,
//                 "Tous les champs sont requis (amount, description, invoiceId, successUrl, cancelUrl)"
//             );
//         }

//         // Vérifier si l'utilisateur existe
//         const user = await prisma.user.findUnique({
//             where: { id: userId },
//             include: { Company: true },
//         });

//         if (!user) {
//             return ApiResponse.error(res, 404, "Utilisateur non trouvé");
//         }

//         // Vérifier si l'utilisateur a un compte Stripe Connect
//         if (!user.stripe_account_id || !user.stripe_onboarded) {
//             return ApiResponse.error(
//                 res,
//                 400,
//                 "L'utilisateur n'a pas de compte Stripe Connect configuré"
//             );
//         }

//         // Récupérer la facture et le client
//         const invoice = await prisma.invoice.findUnique({
//             where: { invoice_id: invoiceId },
//             include: { customer: true },
//         });

//         if (!invoice) {
//             return ApiResponse.error(res, 404, "Facture non trouvée");
//         }

//         // Vérifier que le client a un email
//         if (!invoice.customer.email) {
//             return ApiResponse.error(
//                 res,
//                 400,
//                 "Le client n'a pas d'adresse email"
//             );
//         }

//         // Calculer les frais d'application (exemple: 5%)
//         const applicationFeeAmount = Math.round(Number(amount) * 0.05);

//         // Créer la session de paiement Stripe
//         const session = await stripeService.createCheckoutSession(
//             Number(amount) * 100,
//             "eur",
//             description,
//             user.stripe_account_id,
//             applicationFeeAmount,
//             invoiceId,
//             invoice.customer.email,
//             successUrl,
//             cancelUrl
//         );

//         // Récupérer le nom de la société ou le nom de l'utilisateur
//         const companyName =
//             user.Company?.name || `${user.first_name} ${user.last_name}`;

//         // Construire le contenu de l'email
//         const emailContent = `
//         <html>
//             <body>
//                 <h1>Votre facture est prête à être payée</h1>
//                 <p>Cher client,</p>
//                 <p>Votre facture n°${invoice.invoice_number} d'un montant de ${(
//             amount / 100
//         ).toFixed(2)} € est disponible pour paiement.</p>
//                 <p>Pour procéder au règlement, veuillez cliquer sur le lien ci-dessous :</p>
//                 <p><a href="${
//                     session.url
//                 }" style="display: inline-block; background-color: black; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Payer maintenant</a></p>
//                 <p>Ce lien expirera dans 24 heures.</p>
//                 <p>Merci de votre confiance.</p>
//                 <p>Cordialement,</p>
//                 <p>${companyName}</p>
//             </body>
//         </html>
//         `;

//         // Envoyer l'email
//         await emailService.sendEmail(
//             [invoice.customer.email],
//             `Paiement de votre facture n°${invoice.invoice_number}`,
//             emailContent,
//             {
//                 name: companyName,
//                 email: user.email,
//             }
//         );

//         const response: PaymentWithEmailResponse = {
//             sessionId: session.id,
//             paymentUrl: session.url || "",
//             emailSent: true,
//         };

//         return ApiResponse.success(
//             res,
//             200,
//             "Paiement créé avec succès et email envoyé",
//             response
//         );
//     } catch (error) {
//         logger.error(
//             "Erreur lors de la création du paiement et de l'envoi de l'email:",
//             error
//         );
//         return ApiResponse.error(
//             res,
//             500,
//             "Erreur lors de la création du paiement et de l'envoi de l'email"
//         );
//     }
// };

export const createDashboardLink = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return ApiResponse.error(res, 404, "Utilisateur non trouvé");
        }

        // Vérifier si l'utilisateur a un compte Stripe Connect
        if (!user.stripe_account_id) {
            return ApiResponse.error(
                res,
                400,
                "L'utilisateur n'a pas de compte Stripe Connect"
            );
        }

        // Vérifier si le compte est correctement configuré
        if (!user.stripe_onboarded) {
            return ApiResponse.error(
                res,
                400,
                "Le compte Stripe Connect n'est pas encore complètement configuré"
            );
        }

        // Générer le lien de connexion au dashboard Stripe
        const loginLink = await stripeService.createLoginLink(
            user.stripe_account_id
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
            "Erreur lors de la génération du lien vers le dashboard Stripe:",
            error
        );
        return ApiResponse.error(
            res,
            500,
            "Erreur lors de la génération du lien vers le dashboard Stripe"
        );
    }
};

export const skipStripeSetup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        // Vérifier si l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return ApiResponse.error(res, 404, "Utilisateur non trouvé");
        }

        // Vérifier que l'utilisateur est bien à l'étape STRIPE_SETUP
        if (user.onboarding_step !== "STRIPE_SETUP") {
            return ApiResponse.error(
                res,
                400,
                "L'utilisateur n'est pas à l'étape de configuration Stripe"
            );
        }

        // Mettre à jour l'utilisateur pour terminer l'onboarding
        await prisma.user.update({
            where: { id: userId },
            data: {
                onboarding_step: "FINISH",
            },
        });

        const response: SkipStripeSetupResponse = {
            success: true,
            message: "Configuration Stripe reportée avec succès",
        };

        return ApiResponse.success(
            res,
            200,
            "Configuration Stripe reportée, onboarding terminé",
            response
        );
    } catch (error) {
        logger.error(
            "Erreur lors du report de la configuration Stripe:",
            error
        );
        return ApiResponse.error(
            res,
            500,
            "Erreur lors du report de la configuration Stripe"
        );
    }
};
