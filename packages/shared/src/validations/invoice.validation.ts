import Joi from "joi";
import { ProductUnit, VatRate } from "@prisma/client";

const invoiceItemSchema = Joi.object({
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

export const createInvoiceSchema = Joi.object({
    customer_id: Joi.string().required().messages({
        "string.empty": "L'ID du client est requis",
        "string.base": "L'ID du client doit être une chaîne de caractères",
        "any.required": "L'ID du client est requis",
    }),
    invoice_date: Joi.date().iso().required().messages({
        "date.empty": "La date de facturation est requise",
        "date.base": "La date de facturation doit être une date valide",
        "date.format": "La date de facturation doit être au format ISO",
        "date.max": "La date de facturation ne peut pas être dans le futur",
        "any.required": "La date de facturation est requise",
    }),
    due_date: Joi.date()
        .iso()
        .min(Joi.ref("invoice_date"))
        .required()
        .messages({
            "date.empty": "La date d'échéance est requise",
            "date.base": "La date d'échéance doit être une date valide",
            "date.format": "La date d'échéance doit être au format ISO",
            "date.min":
                "La date d'échéance doit être postérieure à la date de facturation",
            "any.required": "La date d'échéance est requise",
        }),
    items: Joi.array().items(invoiceItemSchema).min(1).required().messages({
        "array.empty": "Les articles sont requis",
        "array.base": "Les articles doivent être un tableau",
        "array.min": "Au moins un article est requis",
        "any.required": "Les articles sont requis",
    }),
    conditions: Joi.string().optional().allow("").max(1000).messages({
        "string.base": "Les conditions doivent être une chaîne de caractères",
        "string.max": "Les conditions ne peuvent pas dépasser 1000 caractères",
        "string.empty": "Les conditions sont requises",
    }),
    late_payment_penalty: Joi.string().optional().allow("").max(1000).messages({
        "string.base":
            "Les pénalités de retard doivent être une chaîne de caractères",
        "string.max":
            "Les pénalités de retard ne peuvent pas dépasser 1000 caractères",
        "string.empty": "Les pénalités de retard sont requises",
    }),
});

export const updateInvoiceSchema = Joi.object({
    invoice_date: Joi.date().iso().optional().allow("", null).messages({
        "date.empty": "La date de facturation est requise",
        "date.base": "La date de facturation doit être une date valide",
        "date.format": "La date de facturation doit être au format ISO",
        "date.max": "La date de facturation ne peut pas être dans le futur",
    }),
    due_date: Joi.date()
        .iso()
        .min(Joi.ref("invoice_date"))
        .optional()
        .allow("", null)
        .messages({
            "date.empty": "La date d'échéance est requise",
            "date.base": "La date d'échéance doit être une date valide",
            "date.format": "La date d'échéance doit être au format ISO",
            "date.min":
                "La date d'échéance doit être postérieure à la date de facturation",
        }),
    status: Joi.string()
        .valid("pending", "paid", "cancelled")
        .optional()
        .allow("", null)
        .messages({
            "string.base": "Le statut doit être une chaîne de caractères",
            "any.only": "Le statut doit être pending, paid ou cancelled",
            "string.empty": "Le statut est requis",
        }),
    conditions: Joi.string().optional().allow("", null).max(1000).messages({
        "string.base": "Les conditions doivent être une chaîne de caractères",
        "string.max": "Les conditions ne peuvent pas dépasser 1000 caractères",
        "string.empty": "Les conditions sont requises",
    }),
    late_payment_penalty: Joi.string()
        .optional()
        .allow("", null)
        .max(1000)
        .messages({
            "string.base":
                "Les pénalités de retard doivent être une chaîne de caractères",
            "string.max":
                "Les pénalités de retard ne peuvent pas dépasser 1000 caractères",
            "string.empty": "Les pénalités de retard sont requises",
        }),
}).min(1);

export const createPaymentSchema = Joi.object({
    payment_date: Joi.date().iso().max("now").required().messages({
        "string.empty": "La date de paiement est requise",
        "date.base": "La date de paiement doit être une date valide",
        "date.format": "La date de paiement doit être au format ISO",
        "date.max": "La date de paiement ne peut pas être dans le futur",
        "any.required": "La date de paiement est requise",
    }),
    amount: Joi.number().positive().precision(2).required().messages({
        "string.empty": "Le montant est requis",
        "number.base": "Le montant doit être un nombre",
        "number.positive": "Le montant doit être positif",
        "number.precision": "Le montant ne peut avoir que 2 décimales maximum",
        "any.required": "Le montant est requis",
    }),
    payment_method: Joi.string()
        .valid("cash", "credit_card", "bank_transfer")
        .required()
        .messages({
            "any.only":
                "Le mode de paiement doit être cash, credit_card ou bank_transfer",
            "any.required": "Le mode de paiement est requis",
            "string.empty": "Le mode de paiement est requis",
        }),
    description: Joi.string().optional().allow("").max(500).messages({
        "string.base": "La description doit être une chaîne de caractères",
        "string.max": "La description ne peut pas dépasser 500 caractères",
    }),
    reference: Joi.string().optional().allow("").max(100).messages({
        "string.base": "La référence doit être une chaîne de caractères",
        "string.max": "La référence ne peut pas dépasser 100 caractères",
    }),
});

export const sendInvoiceWithPaymentLinkSchema = Joi.object({
    successUrl: Joi.string().uri().messages({
        "string.empty": "L'URL de succès est requise",
        "string.uri": "L'URL de succès doit être une URL valide",
        "any.required": "L'URL de succès est requise",
    }),
    cancelUrl: Joi.string().uri().messages({
        "string.empty": "L'URL d'annulation est requise",
        "string.uri": "L'URL d'annulation doit être une URL valide",
        "any.required":
            "L'URL d'annulation est requise si includePaymentLink est true",
    }),
});
