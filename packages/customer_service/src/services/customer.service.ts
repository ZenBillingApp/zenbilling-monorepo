import {
    ICreateCustomerRequest,
    IUpdateCustomerRequest,
    ICustomerQueryParams,
} from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";
import { prisma } from "@zenbilling/shared";
import { ICustomer } from "@zenbilling/shared";
import { Prisma, PrismaClient } from "@prisma/client";

export class CustomerService {
    private static async validateUniqueFields(
        companyId: string,
        email: string | undefined,
        siret: string | undefined,
        siren: string | undefined,
        customerId?: string,
        tx: Prisma.TransactionClient | PrismaClient = prisma
    ): Promise<void> {
        if (email) {
            const existingEmail = await tx.customer.findFirst({
                where: {
                    email,
                    company_id: companyId,
                    ...(customerId && { customer_id: { not: customerId } }),
                },
            });
            if (existingEmail) {
                throw new CustomError(
                    "Un client avec cet email existe déjà dans votre entreprise",
                    409
                );
            }
        }

        if (siret) {
            const existingSiret = await tx.customer.findFirst({
                where: {
                    company_id: companyId,
                    business: {
                        siret: siret,
                        ...(customerId && { customer_id: { not: customerId } }),
                    },
                },
                include: {
                    business: true,
                },
            });
            if (existingSiret) {
                throw new CustomError(
                    "Un client avec ce SIRET existe déjà dans votre entreprise",
                    409
                );
            }
        }

        if (siren) {
            const existingSiren = await tx.customer.findFirst({
                where: {
                    company_id: companyId,
                    business: {
                        siren: siren,
                        ...(customerId && { customer_id: { not: customerId } }),
                    },
                },
                include: {
                    business: true,
                },
            });
            if (existingSiren) {
                throw new CustomError(
                    "Un client avec ce SIREN existe déjà dans votre entreprise",
                    409
                );
            }
        }
    }

    public static async createCustomer(
        userId: string,
        companyId: string,
        customerData: ICreateCustomerRequest
    ): Promise<ICustomer> {
        logger.info({ companyId }, "Début de création de client");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    await this.validateUniqueFields(
                        companyId,
                        customerData.email,
                        customerData.type === "company"
                            ? customerData.business?.siret
                            : undefined,
                        customerData.type === "company"
                            ? customerData.business?.siren
                            : undefined,
                        undefined,
                        tx
                    );

                    // Création du client avec ses détails en une seule transaction
                    const customer = await tx.customer.create({
                        data: {
                            user_id: userId,
                            company_id: companyId,
                            type: customerData.type,
                            email: customerData.email,
                            phone: customerData.phone,
                            address: customerData.address,
                            city: customerData.city,
                            postal_code: customerData.postal_code,
                            country: customerData.country || "France",
                            ...(customerData.type === "individual" &&
                            customerData.individual
                                ? {
                                      individual: {
                                          create: customerData.individual,
                                      },
                                  }
                                : {}),
                            ...(customerData.type === "company" &&
                            customerData.business
                                ? {
                                      business: {
                                          create: customerData.business,
                                      },
                                  }
                                : {}),
                        },
                        include: {
                            individual: true,
                            business: true,
                        },
                    });

                    logger.info(
                        {
                            customerId: customer.customer_id,
                            companyId,
                            type: customerData.type,
                        },
                        "Client créé avec succès"
                    );

                    return customer;
                }
            );
        } catch (error) {
            logger.error(
                { error, companyId },
                "Erreur lors de la création du client"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Erreur lors de la création du client", 500);
        }
    }

    public static async updateCustomer(
        customerId: string,
        companyId: string,
        updateData: IUpdateCustomerRequest
    ): Promise<ICustomer> {
        logger.info(
            { customerId, companyId },
            "Début de mise à jour du client"
        );

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const customer = await tx.customer.findFirst({
                        where: {
                            customer_id: customerId,
                            company_id: companyId,
                        },
                        include: {
                            business: true,
                            individual: true,
                        },
                    });

                    if (!customer) {
                        throw new CustomError("Client non trouvé", 404);
                    }

                    await this.validateUniqueFields(
                        companyId,
                        updateData.email,
                        updateData.business?.siret,
                        updateData.business?.siren,
                        customerId,
                        tx
                    );

                    // Mise à jour du client et de ses détails en une seule transaction
                    const updatedCustomer = await tx.customer.update({
                        where: { customer_id: customerId },
                        data: {
                            email: updateData.email,
                            phone: updateData.phone,
                            address: updateData.address,
                            city: updateData.city,
                            postal_code: updateData.postal_code,
                            country: updateData.country,
                            ...(customer.type === "individual" &&
                            updateData.individual
                                ? {
                                      individual: {
                                          update: updateData.individual,
                                      },
                                  }
                                : {}),
                            ...(customer.type === "company" &&
                            updateData.business
                                ? {
                                      business: {
                                          update: updateData.business,
                                      },
                                  }
                                : {}),
                        },
                        include: {
                            individual: true,
                            business: true,
                        },
                    });

                    logger.info(
                        { customerId, companyId },
                        "Client mis à jour avec succès"
                    );
                    return updatedCustomer;
                }
            );
        } catch (error) {
            logger.error(
                { error, customerId, companyId },
                "Erreur lors de la mise à jour du client"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la mise à jour du client",
                500
            );
        }
    }

    public static async deleteCustomer(
        customerId: string,
        companyId: string
    ): Promise<void> {
        logger.info(
            { customerId, companyId },
            "Début de suppression du client"
        );

        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const customer = await tx.customer.findFirst({
                    where: {
                        customer_id: customerId,
                        company_id: companyId,
                    },
                });

                if (!customer) {
                    throw new CustomError("Client non trouvé", 404);
                }

                await tx.customer.delete({
                    where: { customer_id: customerId },
                });

                logger.info(
                    { customerId, companyId },
                    "Client supprimé avec succès"
                );
            });
        } catch (error) {
            logger.error(
                { error, customerId, companyId },
                "Erreur lors de la suppression du client"
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la suppression du client",
                500
            );
        }
    }

    public static async getCustomerWithDetails(
        customerId: string,
        companyId: string
    ): Promise<ICustomer> {
        const customer = await prisma.customer.findFirst({
            where: {
                customer_id: customerId,
                company_id: companyId,
            },
            include: {
                individual: true,
                business: true,
            },
        });

        if (!customer) {
            throw new CustomError("Client non trouvé", 404);
        }

        return customer;
    }

    public static async getCompanyCustomers(
        companyId: string,
        queryParams: ICustomerQueryParams = {}
    ): Promise<{ customers: ICustomer[]; total: number; totalPages: number }> {
        logger.info({ companyId }, "Récupération des clients de l'entreprise");
        try {
            const {
                page = 1,
                limit = 10,
                search,
                type,
                sortBy = "createdAt",
                sortOrder = "DESC",
            } = queryParams;

            const offset = (page - 1) * limit;
            const whereConditions: any = {
                company_id: companyId,
                ...(type && { type }),
                ...(search && {
                    OR: [
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                        { address: { contains: search, mode: "insensitive" } },
                        { city: { contains: search, mode: "insensitive" } },
                        {
                            postal_code: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                        ...(!type || type === "individual"
                            ? [
                                  {
                                      individual: {
                                          OR: [
                                              {
                                                  first_name: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  last_name: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                          ],
                                      },
                                  },
                              ]
                            : []),
                        ...(!type || type === "company"
                            ? [
                                  {
                                      business: {
                                          OR: [
                                              {
                                                  name: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  siret: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  siren: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                              {
                                                  tva_intra: {
                                                      contains: search,
                                                      mode: "insensitive",
                                                  },
                                              },
                                          ],
                                      },
                                  },
                              ]
                            : []),
                    ],
                }),
            };

            const customers = await prisma.customer.findMany({
                where: whereConditions,
                include: {
                    ...((!type || type === "individual") && {
                        individual: true,
                    }),
                    ...((!type || type === "company") && {
                        business: true,
                    }),
                },
                orderBy: {
                    [sortBy]: sortOrder.toLowerCase(),
                },
                take: limit,
                skip: offset,
            });

            const total = await prisma.customer.count({
                where: whereConditions,
            });

            const totalPages = Math.ceil(total / limit);

            logger.info(
                {
                    companyId,
                    count: total,
                    page: queryParams.page || 1,
                },
                "Clients récupérés avec succès"
            );

            return {
                customers,
                total,
                totalPages,
            };
        } catch (error) {
            logger.error(
                { error, companyId },
                "Erreur lors de la récupération des clients"
            );
            throw new CustomError(
                "Erreur lors de la récupération des clients",
                500
            );
        }
    }
}
