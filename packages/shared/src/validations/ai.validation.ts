import Joi from "joi";

export const generateDescriptionSchema = Joi.object({
    productName: Joi.string().min(2).max(100).trim().required().messages({
        "string.empty": "Le nom du produit est requis",
        "string.min": "Le nom du produit doit contenir au moins 2 caractères",
        "string.max": "Le nom du produit ne doit pas dépasser 100 caractères",
        "any.required": "Le nom du produit est requis",
    }),
    category: Joi.string().max(50).trim().optional().messages({
        "string.max": "La catégorie ne doit pas dépasser 50 caractères",
        "string.base": "La catégorie doit être une chaîne de caractères",
    }),
    additionalInfo: Joi.string().max(500).trim().optional().messages({
        "string.max":
            "Les informations supplémentaires ne doivent pas dépasser 500 caractères",
        "string.base":
            "Les informations supplémentaires doivent être une chaîne de caractères",
    }),
});

export const generateDescriptionSuggestionsSchema = Joi.object({
    productName: Joi.string().min(2).max(100).trim().required().messages({
        "string.empty": "Le nom du produit est requis",
        "string.min": "Le nom du produit doit contenir au moins 2 caractères",
        "string.max": "Le nom du produit ne doit pas dépasser 100 caractères",
        "any.required": "Le nom du produit est requis",
    }),
    category: Joi.string().max(50).trim().optional().messages({
        "string.max": "La catégorie ne doit pas dépasser 50 caractères",
        "string.base": "La catégorie doit être une chaîne de caractères",
    }),
    count: Joi.number().integer().min(1).max(3).default(3).messages({
        "number.base": "Le nombre de suggestions doit être un nombre",
        "number.integer": "Le nombre de suggestions doit être un nombre entier",
        "number.min": "Le nombre de suggestions doit être au minimum de 1",
        "number.max": "Le nombre de suggestions ne peut pas dépasser 3",
    }),
});
