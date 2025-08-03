import Joi from "joi";
import { ProductUnit, VatRate } from "@prisma/client";

const quoteItemSchema = Joi.object({
    product_id: Joi.string().optional().messages({
        "string.empty": "L'ID du produit est requis",
        "string.base": "L'ID du produit doit être une chaîne de caractères",
    }),
    name: Joi.string()
        .when("product_id", {
            is: Joi.exist(),
            then: Joi.optional().allow(""),
            otherwise: Joi.required(),
        })
        .min(2)
        .max(100)
        .messages({
            "string.empty": "Le nom est requis",
            "string.min": "Le nom doit contenir au moins 2 caractères",
            "string.max": "Le nom ne peut pas dépasser 100 caractères",
            "any.required": "Le nom est requis pour un article personnalisé",
        }),
    description: Joi.string().optional().allow("").max(1000).messages({
        "string.empty": "La description est requise",
        "string.base": "La description doit être une chaîne de caractères",
        "string.max": "La description ne peut pas dépasser 500 caractères",
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        "number.empty": "La quantité est requise",
        "number.base": "La quantité doit être un nombre",
        "number.integer": "La quantité doit être un nombre entier",
        "number.min": "La quantité doit être supérieure à 0",
        "any.required": "La quantité est requise",
    }),
    unit_price_excluding_tax: Joi.number()
        .when("product_id", {
            is: Joi.exist(),
            then: Joi.optional().allow(""),
            otherwise: Joi.required(),
        })
        .min(0)
        .precision(2)
        .messages({
            "number.empty": "Le prix unitaire HT est requis",
            "number.base": "Le prix unitaire HT doit être un nombre",
            "number.min": "Le prix unitaire HT doit être positif",
            "number.precision":
                "Le prix unitaire HT ne peut avoir que 2 décimales maximum",
            "any.required":
                "Le prix unitaire HT est requis pour un article personnalisé",
        }),
    vat_rate: Joi.number()
        .when("product_id", {
            is: Joi.exist(),
            then: Joi.optional().allow(""),
            otherwise: Joi.required(),
        })
        .valid(...Object.values(VatRate))
        .messages({
            "number.empty": "Le taux de TVA est requis",
            "number.base": "Le taux de TVA doit être un nombre",
            "any.only":
                "Le taux de TVA doit être l'un des taux suivants : 0%, 2.1%, 5.5%, 10% ou 20%",
            "any.required":
                "Le taux de TVA est requis pour un article personnalisé",
        }),
    unit: Joi.string()
        .when("product_id", {
            is: Joi.exist(),
            then: Joi.optional().allow(""),
            otherwise: Joi.required(),
        })
        .valid(...Object.values(ProductUnit))
        .default("unité")
        .messages({
            "string.base": "L'unité doit être une chaîne de caractères",
            "any.only": "L'unité n'est pas valide",
        }),
    save_as_product: Joi.boolean()
        .optional()
        .when("product_id", {
            is: Joi.exist(),
            then: Joi.valid(false),
            otherwise: Joi.optional().allow(""),
        })
        .messages({
            "boolean.empty": "save_as_product doit être un booléen",
            "boolean.base": "save_as_product doit être un booléen",
            "any.only":
                "Impossible de sauvegarder un produit existant comme nouveau produit",
        }),
});

export const createQuoteSchema = Joi.object({
    customer_id: Joi.string().required().messages({
        "string.empty": "L'ID du client est requis",
        "string.base": "L'ID du client doit être une chaîne de caractères",
        "any.required": "L'ID du client est requis",
    }),
    quote_date: Joi.date().iso().required().messages({
        "date.empty": "La date du devis est requise",
        "date.base": "La date du devis doit être une date valide",
        "date.format": "La date du devis doit être au format ISO",
        "any.required": "La date du devis est requise",
    }),
    validity_date: Joi.date()
        .iso()
        .min(Joi.ref("quote_date"))
        .required()
        .messages({
            "date.empty": "La date de validité est requise",
            "date.base": "La date de validité doit être une date valide",
            "date.format": "La date de validité doit être au format ISO",
            "date.min":
                "La date de validité doit être postérieure à la date du devis",
            "any.required": "La date de validité est requise",
        }),
    items: Joi.array().items(quoteItemSchema).min(1).required().messages({
        "array.empty": "Les articles sont requis",
        "array.base": "Les articles doivent être un tableau",
        "array.min": "Au moins un article est requis",
        "any.required": "Les articles sont requis",
    }),
    conditions: Joi.string().optional().allow("").max(1000).messages({
        "string.base": "Les conditions doivent être une chaîne de caractères",
        "string.max": "Les conditions ne peuvent pas dépasser 1000 caractères",
    }),
    notes: Joi.string().optional().allow("").max(1000).messages({
        "string.base": "Les notes doivent être une chaîne de caractères",
        "string.max": "Les notes ne peuvent pas dépasser 1000 caractères",
    }),
});

export const updateQuoteSchema = Joi.object({
    quote_date: Joi.date().iso().optional().messages({
        "date.base": "La date du devis doit être une date valide",
        "date.format": "La date du devis doit être au format ISO",
    }),
    validity_date: Joi.date()
        .iso()
        .min(Joi.ref("quote_date"))
        .optional()
        .messages({
            "date.base": "La date de validité doit être une date valide",
            "date.format": "La date de validité doit être au format ISO",
            "date.min":
                "La date de validité doit être postérieure à la date du devis",
        }),
    status: Joi.string()
        .valid("draft", "sent", "accepted", "rejected", "expired")
        .optional()
        .messages({
            "string.base": "Le statut doit être une chaîne de caractères",
            "any.only":
                "Le statut doit être draft, sent, accepted, rejected ou expired",
        }),
    conditions: Joi.string().optional().allow("").max(1000).messages({
        "string.base": "Les conditions doivent être une chaîne de caractères",
        "string.max": "Les conditions ne peuvent pas dépasser 1000 caractères",
    }),
    notes: Joi.string().optional().allow("").max(1000).messages({
        "string.base": "Les notes doivent être une chaîne de caractères",
        "string.max": "Les notes ne peuvent pas dépasser 1000 caractères",
    }),
}).min(1);
