import {
    ICreateProductRequest,
    IUpdateProductRequest,
    IProductQueryParams,
} from "@zenbilling/shared";
import { ProductUnit } from "@zenbilling/shared";
import { CustomError } from "@zenbilling/shared";
import { logger } from "@zenbilling/shared";
import { prisma } from "@zenbilling/shared";
import { IProduct, VatRate } from "@zenbilling/shared";
import { Prisma, PrismaClient } from "@prisma/client";

export class ProductService {
    private static readonly availableUnits: ProductUnit[] = [
        "unite",
        "kg",
        "g",
        "l",
        "ml",
        "m",
        "cm",
        "m2",
        "cm2",
        "m3",
        "h",
        "jour",
        "mois",
        "annee",
    ];

    private static readonly availableVatRates: VatRate[] = [
        "ZERO",
        "REDUCED_1",
        "REDUCED_2",
        "REDUCED_3",
        "STANDARD",
    ];

    public static getAvailableUnits(): { units: ProductUnit[] } {
        return { units: this.availableUnits };
    }

    public static getAvailableVatRates(): { vatRates: VatRate[] } {
        return { vatRates: this.availableVatRates };
    }

    private static async validateProductName(
        name: string,
        companyId: string,
        productId?: string,
        tx: Prisma.TransactionClient | PrismaClient = prisma,
    ): Promise<void> {
        const whereClause: any = {
            name,
            company_id: companyId,
            ...(productId && { product_id: { not: productId } }),
        };

        const existingProduct = await tx.product.findFirst({
            where: whereClause,
        });

        if (existingProduct) {
            throw new CustomError(
                "Un produit avec ce nom existe déjà dans votre entreprise",
                409,
            );
        }
    }

    private static async validateProductAccess(
        productId: string,
        companyId: string,
        tx: Prisma.TransactionClient | PrismaClient = prisma,
    ): Promise<IProduct> {
        const product = await tx.product.findFirst({
            where: {
                product_id: productId,
                company_id: companyId,
            },
        });

        if (!product) {
            throw new CustomError("Produit non trouvé", 404);
        }

        return product;
    }

    public static async createProduct(
        companyId: string,
        productData: ICreateProductRequest,
    ): Promise<IProduct> {
        logger.info({ companyId }, "Début de création de produit");

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    await this.validateProductName(
                        productData.name,
                        companyId,
                        undefined,
                        tx,
                    );

                    const product = await tx.product.create({
                        data: {
                            ...productData,
                            unit: productData.unit || "unite",
                            company_id: companyId,
                        },
                    });

                    logger.info(
                        {
                            productId: product.product_id,
                            companyId,
                            name: product.name,
                        },
                        "Produit créé avec succès",
                    );

                    return product;
                },
            );
        } catch (error) {
            logger.error(
                { error, companyId },
                "Erreur lors de la création du produit",
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Erreur lors de la création du produit", 500);
        }
    }

    public static async updateProduct(
        productId: string,
        companyId: string,
        updateData: IUpdateProductRequest,
    ): Promise<IProduct> {
        logger.info(
            { productId, companyId },
            "Début de mise à jour du produit",
        );

        try {
            return await prisma.$transaction(
                async (tx: Prisma.TransactionClient) => {
                    const product = await this.validateProductAccess(
                        productId,
                        companyId,
                        tx,
                    );

                    if (updateData.name && updateData.name !== product.name) {
                        await this.validateProductName(
                            updateData.name,
                            companyId,
                            productId,
                            tx,
                        );
                    }

                    const updatedProduct = await tx.product.update({
                        where: { product_id: productId },
                        data: updateData,
                    });

                    logger.info(
                        { productId, companyId },
                        "Produit mis à jour avec succès",
                    );
                    return updatedProduct;
                },
            );
        } catch (error) {
            logger.error(
                { error, productId, companyId },
                "Erreur lors de la mise à jour du produit",
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la mise à jour du produit",
                500,
            );
        }
    }

    public static async deleteProduct(
        productId: string,
        companyId: string,
    ): Promise<void> {
        logger.info(
            { productId, companyId },
            "Début de suppression du produit",
        );

        try {
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // Vérifier si le produit est utilisé dans des factures
                const usedInInvoices = await tx.invoiceItem.findFirst({
                    where: { product_id: productId },
                });

                if (usedInInvoices) {
                    throw new CustomError(
                        "Impossible de supprimer ce produit car il est utilisé dans des factures",
                        400,
                    );
                }

                await tx.product.delete({
                    where: { product_id: productId },
                });

                logger.info(
                    { productId, companyId },
                    "Produit supprimé avec succès",
                );
            });
        } catch (error) {
            logger.error(
                { error, productId, companyId },
                "Erreur lors de la suppression du produit",
            );
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                "Erreur lors de la suppression du produit",
                500,
            );
        }
    }

    public static async getProduct(
        productId: string,
        companyId: string,
    ): Promise<IProduct> {
        const product = await this.validateProductAccess(productId, companyId);
        return product;
    }

    public static async getCompanyProducts(
        companyId: string,
        queryParams: IProductQueryParams = {},
    ): Promise<{ products: IProduct[]; total: number; totalPages: number }> {
        const {
            page = 1,
            limit = 10,
            search,
            minPrice,
            maxPrice,
            minVatRate,
            maxVatRate,
            sortBy = "name",
            sortOrder = "ASC",
        } = queryParams;

        const offset = (page - 1) * limit;

        const whereClause: any = {
            company_id: companyId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            }),
            ...(minPrice !== undefined || maxPrice !== undefined
                ? {
                      price_excluding_tax: {
                          ...(minPrice !== undefined && { gte: minPrice }),
                          ...(maxPrice !== undefined && { lte: maxPrice }),
                      },
                  }
                : {}),
            ...(minVatRate !== undefined || maxVatRate !== undefined
                ? {
                      vat_rate: {
                          ...(minVatRate !== undefined && { gte: minVatRate }),
                          ...(maxVatRate !== undefined && { lte: maxVatRate }),
                      },
                  }
                : {}),
        };

        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where: whereClause,
                orderBy: {
                    [sortBy]: sortOrder.toLowerCase(),
                },
                take: limit,
                skip: offset,
            }),
            prisma.product.count({
                where: whereClause,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            products,
            total,
            totalPages,
        };
    }
}
