import Joi from "joi";

const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
const siretRegex = /^\d{14}$/;
const sirenRegex = /^\d{9}$/;
const tvaIntraRegex = /^FR[0-9A-Z]{2}[0-9]{9}$/;

const addressSchema = {
    address: Joi.string().min(5).max(100).required().messages({
        "string.empty": "L'adresse est requise",
        "string.min": "L'adresse doit contenir au moins 5 caractères",
        "string.max": "L'adresse ne peut pas dépasser 100 caractères",
        "any.required": "L'adresse est requise",
    }),
    city: Joi.string()
        .pattern(/^[A-Za-zÀ-ÿ\s-]{2,50}$/)
        .required()
        .messages({
            "string.pattern.base":
                "La ville doit contenir uniquement des lettres, espaces et tirets",
            "string.empty": "La ville est requise",
            "any.required": "La ville est requise",
        }),
    postal_code: Joi.string()
        .pattern(/^\d{5}$/)
        .required()
        .messages({
            "string.pattern.base":
                "Le code postal doit contenir exactement 5 chiffres",
            "string.empty": "Le code postal est requis",
            "any.required": "Le code postal est requis",
        }),
    country: Joi.string()
        .default("France")
        .pattern(/^[A-Za-zÀ-ÿ\s-]{2,50}$/)
        .messages({
            "string.pattern.base":
                "Le pays doit contenir uniquement des lettres, espaces et tirets",
        }),
};

const contactSchema = {
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            "string.empty": "L'email est requis",
            "string.email": "Format d'email invalide",
            "any.required": "L'email est requis",
        }),
    phone: Joi.string().pattern(phoneRegex).allow("").optional().messages({
        "string.pattern.base":
            "Le numéro de téléphone doit être au format français (+33 ou 0 suivi de 9 chiffres)",
    }),
};

const individualSchema = Joi.object({
    first_name: Joi.string().min(2).max(50).required().messages({
        "string.empty": "Le prénom est requis",
        "string.min": "Le prénom doit contenir au moins 2 caractères",
        "string.max": "Le prénom ne peut pas dépasser 50 caractères",
        "any.required": "Le prénom est requis",
    }),
    last_name: Joi.string().min(2).max(50).required().messages({
        "string.empty": "Le nom est requis",
        "string.min": "Le nom doit contenir au moins 2 caractères",
        "string.max": "Le nom ne peut pas dépasser 50 caractères",
        "any.required": "Le nom est requis",
    }),
});

const businessSchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        "string.empty": "Le nom de l'entreprise est requis",
        "string.min":
            "Le nom de l'entreprise doit contenir au moins 2 caractères",
        "string.max":
            "Le nom de l'entreprise ne peut pas dépasser 100 caractères",
        "any.required": "Le nom de l'entreprise est requis",
    }),
    siret: Joi.string().pattern(siretRegex).required().messages({
        "string.empty": "Le SIRET est requis",
        "string.pattern.base": "Le SIRET doit contenir exactement 14 chiffres",
        "any.required": "Le SIRET est requis",
    }),
    siren: Joi.string().pattern(sirenRegex).required().messages({
        "string.empty": "Le SIREN est requis",
        "string.pattern.base": "Le SIREN doit contenir exactement 9 chiffres",
        "any.required": "Le SIREN est requis",
    }),
    tva_applicable: Joi.boolean().required().messages({
        "boolean.base": "La TVA applicable doit être un booléen",
        "any.required": "La TVA applicable est requise",
    }),
    tva_intra: Joi.when("tva_applicable", {
        is: true,
        then: Joi.string().pattern(tvaIntraRegex).required().messages({
            "string.empty":
                "Le numéro de TVA intracommunautaire est requis quand la TVA est applicable",
            "string.pattern.base":
                "Le numéro de TVA intracommunautaire doit être au format FR + 11 caractères",
            "any.required":
                "Le numéro de TVA intracommunautaire est requis quand la TVA est applicable",
        }),
        otherwise: Joi.string()
            .pattern(tvaIntraRegex)
            .allow("")
            .optional()
            .messages({
                "string.pattern.base":
                    "Le numéro de TVA intracommunautaire doit être au format FR + 11 caractères",
            }),
    }),
});

export const createCustomerSchema = Joi.object({
    type: Joi.string().valid("individual", "company").required().messages({
        "string.empty": "Le type est requis",
        "any.only": 'Le type doit être "individual" ou "company"',
        "any.required": "Le type est requis",
    }),
    ...contactSchema,
    ...addressSchema,
    individual: Joi.when("type", {
        is: "individual",
        then: individualSchema.required(),
        otherwise: Joi.forbidden(),
    }).messages({
        "any.required": 'l\'objet "individual" est requis',
    }),
    business: Joi.when("type", {
        is: "company",
        then: businessSchema.required(),
        otherwise: Joi.forbidden(),
    }).messages({
        "any.required": 'l\'objet "business" est requis',
    }),
});

export const updateCustomerSchema = Joi.object({
    ...contactSchema,
    ...addressSchema,
    individual: individualSchema.optional(),
    business: businessSchema.optional(),
}).min(1);
