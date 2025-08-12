import {
    ICreateCompanyRequest,
    IUpdateCompanyRequest,
} from "@zenbilling/shared/src/interfaces/Company.request.interface";
import prisma from "@zenbilling/shared/src/libs/prisma";
import {
    ICompany,
    LegalForm,
} from "@zenbilling/shared/src/interfaces/Company.interface";
import { IUser } from "@zenbilling/shared/src/interfaces/User.interface";
import { CustomError } from "@zenbilling/shared/src/utils/customError";
import logger from "@zenbilling/shared/src/utils/logger";
import { PrismaClient, Prisma } from "@zenbilling/shared/src/libs/prisma";

export class CompanyService {
    private static readonly availableLegalForms: LegalForm[] = [
        "SAS",
        "SARL",
        "EURL",
        "SASU",
        "SA",
        "SNC",
        "SOCIETE_CIVILE",
        "ENTREPRISE_INDIVIDUELLE",
    ];

    public static getAvailableLegalForms(): { legalForms: LegalForm[] } {
        return { legalForms: this.availableLegalForms };
    }

    private static async validateUniqueFields(
        siret: string,
        siren: string,
        companyId?: string
    ): Promise<void> {
        logger.debug(
            { siret, siren, companyId },
            "Validation des champs uniques"
        );

        // Vérification de l'unicité du SIRET
        const existingSiret = await prisma.company.findFirst({
            where: {
                siret,
                ...(companyId && { company_id: { not: companyId } }),
            },
        });
        if (existingSiret) {
            logger.warn({ siret }, "SIRET déjà existant");
            throw new CustomError(
                "Une entreprise avec ce SIRET existe déjà",
                409
            );
        }

        // Vérification de l'unicité du SIREN
        const existingSiren = await prisma.company.findFirst({
            where: {
                siren,
                ...(companyId && { company_id: { not: companyId } }),
            },
        });
        if (existingSiren) {
            logger.warn({ siren }, "SIREN déjà existant");
            throw new CustomError(
                "Une entreprise avec ce SIREN existe déjà",
                409
            );
        }
    }

    public static async createCompany(
        companyData: ICreateCompanyRequest,
        userId: string
    ): Promise<ICompany> {
        logger.info({ userId }, "Début de création d'entreprise");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient | PrismaClient) => {
                    // Vérifier si l'utilisateur a déjà une entreprise
                    const user = await tx.user.findUnique({
                        where: {
                            id: userId,
                        },
                    });

                    if (!user) {
                        logger.warn(
                            { userId },
                            "Utilisateur non trouvé lors de la création d'entreprise"
                        );
                        throw new CustomError("Utilisateur non trouvé", 404);
                    }

                    if (user.company_id) {
                        logger.warn(
                            { userId, existingCompanyId: user.company_id },
                            "Utilisateur possède déjà une entreprise"
                        );
                        throw new CustomError(
                            "Vous possédez déjà une entreprise",
                            409
                        );
                    }

                    await this.validateUniqueFields(
                        companyData.siret,
                        companyData.siren
                    );

                    const { company_id, ...companyDataWithoutId } = companyData;
                    const company = await tx.company.create({
                        data: companyDataWithoutId,
                    });

                    await tx.user.update({
                        where: { id: userId },
                        data: {
                            company_id: company.company_id,
                            onboarding_step: "STRIPE_SETUP",
                        },
                    });

                    logger.info(
                        { companyId: company.company_id, userId },
                        "Entreprise créée avec succès"
                    );
                    return company;
                }
            );
        } catch (error) {
            logger.error(
                { error, userId },
                "Erreur lors de la création de l'entreprise"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la création de l'entreprise",
                500
            );
        }
    }

    public static async getCompany(companyId: string): Promise<ICompany> {
        logger.debug(
            { companyId },
            "Récupération des informations de l'entreprise"
        );

        const company = await prisma.company.findUnique({
            where: { company_id: companyId },
            include: {
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });

        if (!company) {
            logger.warn({ companyId }, "Entreprise non trouvée");
            throw new CustomError("Entreprise non trouvée", 404);
        }

        logger.debug(
            { companyId },
            "Informations de l'entreprise récupérées avec succès"
        );
        return company as ICompany;
    }

    public static async updateCompany(
        companyId: string,
        updateData: IUpdateCompanyRequest
    ): Promise<ICompany> {
        logger.info({ companyId }, "Début de mise à jour de l'entreprise");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient | PrismaClient) => {
                    const company = await tx.company.findUnique({
                        where: { company_id: companyId },
                    });

                    if (!company) {
                        logger.warn(
                            { companyId },
                            "Entreprise non trouvée lors de la mise à jour"
                        );
                        throw new CustomError("Entreprise non trouvée", 404);
                    }

                    if (updateData.siret || updateData.siren) {
                        await this.validateUniqueFields(
                            updateData.siret || company.siret,
                            updateData.siren || company.siren,
                            companyId
                        );
                    }

                    const updatedCompany = await tx.company.update({
                        where: { company_id: companyId },
                        data: updateData,
                    });

                    logger.info(
                        { companyId },
                        "Entreprise mise à jour avec succès"
                    );
                    return updatedCompany;
                }
            );
        } catch (error) {
            logger.error(
                { error, companyId },
                "Erreur lors de la mise à jour de l'entreprise"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la mise à jour de l'entreprise",
                500
            );
        }
    }

    public static async deleteCompany(companyId: string): Promise<void> {
        logger.info({ companyId }, "Début de suppression de l'entreprise");

        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const company = await tx.company.findUnique({
                    where: { company_id: companyId },
                });

                if (!company) {
                    logger.warn(
                        { companyId },
                        "Entreprise non trouvée lors de la suppression"
                    );
                    throw new CustomError("Entreprise non trouvée", 404);
                }

                // Mettre à jour les utilisateurs associés
                await tx.user.updateMany({
                    where: { company_id: companyId },
                    data: {
                        company_id: null,
                        onboarding_completed: false,
                        onboarding_step: "CHOOSING_COMPANY",
                    },
                });

                await tx.company.delete({
                    where: { company_id: companyId },
                });

                logger.info({ companyId }, "Entreprise supprimée avec succès");
            });
        } catch (error) {
            logger.error(
                { error, companyId },
                "Erreur lors de la suppression de l'entreprise"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la suppression de l'entreprise",
                500
            );
        }
    }

    public static async getCompanyUsers(
        companyId: string
    ): Promise<Partial<IUser>[]> {
        logger.debug(
            { companyId },
            "Récupération des utilisateurs de l'entreprise"
        );

        const company = await prisma.company.findUnique({
            where: { company_id: companyId },
            include: {
                users: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        onboarding_completed: true,
                        onboarding_step: true,
                    },
                },
            },
        });

        if (!company) {
            logger.warn(
                { companyId },
                "Entreprise non trouvée lors de la récupération des utilisateurs"
            );
            throw new CustomError("Entreprise non trouvée", 404);
        }

        logger.debug(
            { companyId, userCount: company.users?.length },
            "Utilisateurs de l'entreprise récupérés avec succès"
        );
        return company.users;
    }
}
