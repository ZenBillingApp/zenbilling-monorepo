import { Request, Response } from "express";
import { ApiResponse, logger, prisma } from "@zenbilling/shared";

export class OrganizationController {
    /**
     * Récupère une organisation par son ID
     * Endpoint pour les appels inter-services
     * Utilise Prisma directement car Better Auth ne fournit pas d'endpoint simple pour get by ID
     */
    public static async getOrganizationById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            logger.info(
                { organizationId: id },
                "Récupération organisation par ID (inter-service)"
            );

            const organization = await prisma.organization.findUnique({
                where: { id },
            });

            if (!organization) {
                logger.warn({ organizationId: id }, "Organisation non trouvée");
                return ApiResponse.error(res, 404, "Organisation non trouvée");
            }

            return ApiResponse.success(
                res,
                200,
                "Organisation récupérée avec succès",
                organization
            );
        } catch (error) {
            logger.error(
                { error, organizationId: req.params.id },
                "Erreur récupération organisation"
            );
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * Recherche une organisation par stripe_account_id
     * Endpoint pour les webhooks Stripe
     * GET /api/organizations/find?stripe_account_id=xxx
     */
    public static async findOrganization(req: Request, res: Response) {
        try {
            const { stripe_account_id } = req.query;

            if (!stripe_account_id) {
                return ApiResponse.error(
                    res,
                    400,
                    "stripe_account_id est requis"
                );
            }

            logger.info(
                { stripeAccountId: stripe_account_id },
                "Recherche organisation par stripe_account_id (inter-service)"
            );

            const organization = await prisma.organization.findFirst({
                where: { stripe_account_id: stripe_account_id as string },
            });

            if (!organization) {
                logger.warn(
                    { stripeAccountId: stripe_account_id },
                    "Organisation non trouvée"
                );
                return ApiResponse.error(res, 404, "Organisation non trouvée");
            }

            return ApiResponse.success(
                res,
                200,
                "Organisation trouvée avec succès",
                organization
            );
        } catch (error) {
            logger.error(
                { error, stripeAccountId: req.query.stripe_account_id },
                "Erreur recherche organisation"
            );
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }

    /**
     * Met à jour une organisation
     * Endpoint pour les appels inter-services (ex: Stripe Service)
     * Utilise Prisma directement pour plus de flexibilité
     */
    public static async updateOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            logger.info(
                { organizationId: id, updateData },
                "Mise à jour organisation (inter-service)"
            );

            // Vérifier que l'organisation existe
            const organization = await prisma.organization.findUnique({
                where: { id },
            });

            if (!organization) {
                logger.warn(
                    { organizationId: id },
                    "Tentative de mise à jour d'une organisation inexistante"
                );
                return ApiResponse.error(res, 404, "Organisation non trouvée");
            }

            // Mettre à jour l'organisation
            const updatedOrganization = await prisma.organization.update({
                where: { id },
                data: updateData,
            });

            logger.info(
                { organizationId: id },
                "Organisation mise à jour avec succès"
            );

            return ApiResponse.success(
                res,
                200,
                "Organisation mise à jour avec succès",
                updatedOrganization
            );
        } catch (error) {
            logger.error(
                { error, organizationId: req.params.id },
                "Erreur mise à jour organisation"
            );
            return ApiResponse.error(res, 500, "Erreur interne du serveur");
        }
    }
}
