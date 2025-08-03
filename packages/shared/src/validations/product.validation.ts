import Joi from "joi";
import { ProductUnit, VatRate } from "@prisma/client";

const productBaseSchema = {
    name: Joi.string().min(2).max(100).trim().messages({
        "string.empty": "Le nom du produit est requis",
        "string.min": "Le nom du produit doit contenir au moins 2 caractères",
        "string.max": "Le nom du produit ne doit pas dépasser 100 caractères",
        "any.required": "Le nom du produit est requis",
    }),
    description: Joi.string().allow("").max(1000).optional().messages({
        "string.base": "La description doit être une chaîne de caractères",
        "string.empty": "La description est requise",
        "string.max": "La description ne doit pas dépasser 1000 caractères",
    }),
    price_excluding_tax: Joi.number().precision(2).min(0).messages({
        "number.empty": "Le prix HT est requis",
        "number.base": "Le prix HT doit être un nombre",
        "number.min": "Le prix HT doit être positif",
        "number.precision": "Le prix HT ne peut avoir que 2 décimales maximum",
        "any.required": "Le prix HT est requis",
    }),
    vat_rate: Joi.number()
        .valid(...Object.values(VatRate))
        .messages({
            "number.empty": "Le taux de TVA est requis",
            "number.base": "Le taux de TVA doit être un nombre",
            "any.only":
                "Le taux de TVA doit être l'un des taux suivants : 0%, 2.1%, 5.5%, 10% ou 20%",
            "any.required": "Le taux de TVA est requis",
        }),
    unit: Joi.string()
        .valid(...Object.values(ProductUnit))
        .default("unité")
        .messages({
            "string.base": "L'unité doit être une chaîne de caractères",
            "any.only": "L'unité n'est pas valide",
        }),
};

export const createProductSchema = Joi.object({
    ...productBaseSchema,
    name: productBaseSchema.name.required(),
    price_excluding_tax: productBaseSchema.price_excluding_tax.required(),
    vat_rate: productBaseSchema.vat_rate.required(),
    unit: productBaseSchema.unit.required(),
});

export const updateProductSchema = Joi.object({
    ...productBaseSchema,
    name: productBaseSchema.name.optional(),
    price_excluding_tax: productBaseSchema.price_excluding_tax.optional(),
    vat_rate: productBaseSchema.vat_rate.optional(),
    unit: productBaseSchema.unit.optional(),
}).min(1);
