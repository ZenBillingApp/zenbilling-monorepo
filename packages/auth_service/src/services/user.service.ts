import {
    IUpdateUserRequest,
    IUserResponse,
} from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";
import { prisma } from "@zenbilling/shared";
import { Prisma } from "@prisma/client";

export class UserService {
    public static async updateUser(
        userId: string,
        updateData: IUpdateUserRequest
    ): Promise<IUserResponse> {
        logger.info({ userId }, "Début de mise à jour de l'utilisateur");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const user = await tx.user.findUnique({
                        where: { id: userId },
                    });

                    if (!user) {
                        logger.warn(
                            { userId },
                            "Tentative de mise à jour d'un utilisateur inexistant"
                        );
                        throw new CustomError("Utilisateur non trouvé", 404);
                    }

                    const updatedUser = await tx.user.update({
                        where: { id: userId },
                        data: updateData,
                    });

                    logger.info(
                        { userId },
                        "Utilisateur mis à jour avec succès"
                    );
                    return updatedUser;
                }
            );
        } catch (error) {
            logger.error(
                { error, userId },
                "Erreur lors de la mise à jour de l'utilisateur"
            );
            if (error instanceof CustomError) throw error;
            throw new CustomError("Erreur lors de la mise à jour", 500);
        }
    }

    public static async deleteUser(userId: string): Promise<void> {
        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                });

                if (!user) {
                    throw new CustomError("Utilisateur non trouvé", 404);
                }

                await tx.user.delete({
                    where: { id: userId },
                });

                logger.info({ userId }, "Utilisateur supprimé avec succès");
            });
        } catch (error) {
            logger.error(
                { error, userId },
                "Erreur lors de la suppression de l'utilisateur"
            );
            if (error instanceof CustomError) throw error;
            throw new CustomError("Erreur lors de la suppression", 500);
        }
    }

    public static async onboardingFinish(userId: string): Promise<void> {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { onboarding_completed: true },
            });
        } catch (error) {
            logger.error(
                { error, userId },
                "Erreur lors de la fin de l'onboarding"
            );
            if (error instanceof CustomError) throw error;
            throw new CustomError(
                "Erreur lors de la complétion de l'onboarding",
                500
            );
        }
    }
}
