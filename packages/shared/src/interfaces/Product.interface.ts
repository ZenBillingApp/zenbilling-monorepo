import { Decimal } from "@prisma/client/runtime/library";

export type ProductUnit =
    | "unite"
    | "kg"
    | "g"
    | "l"
    | "ml"
    | "m"
    | "cm"
    | "m2"
    | "cm2"
    | "m3"
    | "h"
    | "jour"
    | "mois"
    | "annee";

export type VatRate =
    | "ZERO"
    | "REDUCED_1"
    | "REDUCED_2"
    | "REDUCED_3"
    | "STANDARD";

export interface IProduct {
    product_id: string;
    company_id: string;
    name: string;
    description: string | null;
    price_excluding_tax: Decimal;
    vat_rate: VatRate;
    unit: ProductUnit;
    createdAt: Date;
    updatedAt: Date;
}

// Utilitaire pour convertir VatRate en valeur numérique
export const vatRateToNumber = (vatRate: VatRate): number => {
    const mapping = {
        ZERO: 0.0,
        REDUCED_1: 2.1,
        REDUCED_2: 5.5,
        REDUCED_3: 10.0,
        STANDARD: 20.0,
    };
    return mapping[vatRate];
};
