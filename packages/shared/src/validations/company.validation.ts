import Joi from "joi";

const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
const siretRegex = /^\d{14}$/;
const sirenRegex = /^\d{9}$/;
const tvaIntraRegex = /^FR[0-9A-Z]{2}[0-9]{9}$/;

const validateLuhn = (value: string) => {
    let sum = 0;
    let double = false;
    for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value.charAt(i));
        if (double) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        double = !double;
    }
    return sum % 10 === 0;
};

export const companySchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        "string.base": "Le nom doit être une chaîne de caractères",
        "string.empty": "Le nom est requis",
        "string.min": "Le nom doit contenir au moins 2 caractères",
        "string.max": "Le nom ne peut pas dépasser 100 caractères",
        "any.required": "Le nom est requis",
    }),

    siret: Joi.string()
        .pattern(siretRegex)
        .required()
        .custom((value, helpers) => {
            if (!validateLuhn(value)) {
                return helpers.error("string.invalidSiret");
            }
            return value;
        })
        .messages({
            "string.base": "Le SIRET doit être une chaîne de caractères",
            "string.empty": "Le SIRET est requis",
            "string.pattern.base":
                "Le SIRET doit contenir exactement 14 chiffres",
            "string.invalidSiret": "SIRET invalide",
            "any.required": "Le SIRET est requis",
        }),

    tva_applicable: Joi.boolean().required().messages({
        "boolean.base": "La TVA applicable doit être un booléen",
        "boolean.empty": "La TVA applicable est requise",
        "any.required": "La TVA applicable est requise",
    }),

    tva_intra: Joi.string()
        .pattern(tvaIntraRegex)
        .custom((value, helpers) => {
            const siren = value.substring(4);
            if (!/^\d{9}$/.test(siren)) {
                return helpers.error("string.invalidTva");
            }
            return value;
        })
        .allow(null, "")
        .when("tva_applicable", {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            "string.base":
                "La TVA intracommunautaire doit être une chaîne de caractères",
            "string.pattern.base":
                "La TVA intracommunautaire doit être au format FR + 11 caractères",
            "string.empty":
                "La TVA intracommunautaire est requise quand la TVA est applicable",
            "string.invalidTva":
                "TVA intracommunautaire invalide - le SIREN ne correspond pas",
            "any.required":
                "La TVA intracommunautaire est requise quand la TVA est applicable",
        }),

    RCS_number: Joi.string()
        .pattern(/^[A-Za-z0-9\s-]{1,50}$/)
        .required()
        .messages({
            "string.base": "Le numéro RCS doit être une chaîne de caractères",
            "string.pattern.base":
                "Le numéro RCS doit contenir uniquement des lettres, chiffres, espaces et tirets (max 50 caractères)",
            "string.empty": "Le numéro RCS est requis",
            "any.required": "Le numéro RCS est requis",
        }),

    RCS_city: Joi.string()
        .pattern(/^[A-Za-zÀ-ÿ\s-]{2,50}$/)
        .required()
        .messages({
            "string.base": "La ville RCS doit être une chaîne de caractères",
            "string.pattern.base":
                "La ville RCS doit contenir uniquement des lettres, espaces et tirets (entre 2 et 50 caractères)",
            "string.max": "La ville RCS ne peut pas dépasser 50 caractères",
            "string.min": "La ville RCS doit contenir au moins 2 caractères",
            "string.empty": "La ville RCS est requise",
            "any.required": "La ville RCS est requise",
        }),

    capital: Joi.number()
        .min(0)
        .max(999999999.99)
        .precision(2)
        .optional()
        .allow(null, "")
        .messages({
            "number.base": "Le capital doit être un nombre",
            "number.empty": "Le capital est requis",
            "number.min": "Le capital doit être supérieur à 0",
            "number.max": "Le capital ne peut pas dépasser 999 999 999,99",
            "number.precision":
                "Le capital ne peut avoir que 2 décimales maximum",
            "any.required": "Le capital est requis",
        }),

    siren: Joi.string()
        .pattern(sirenRegex)
        .required()
        .custom((value, helpers) => {
            if (!validateLuhn(value)) {
                return helpers.error("string.invalidSiren");
            }
            return value;
        })
        .messages({
            "string.base": "Le SIREN doit être une chaîne de caractères",
            "string.pattern.base":
                "Le SIREN doit contenir exactement 9 chiffres",
            "string.empty": "Le SIREN est requis",
            "string.invalidSiren": "SIREN invalide",
            "any.required": "Le SIREN est requis",
        }),

    legal_form: Joi.string()
        .valid(
            "SAS",
            "SARL",
            "SA",
            "SASU",
            "EURL",
            "SNC",
            "SOCIETE_CIVILE",
            "ENTREPRISE_INDIVIDUELLE"
        )
        .required()
        .messages({
            "string.base":
                "La forme juridique doit être une chaîne de caractères",
            "any.only":
                "Forme juridique invalide - doit être l'une des valeurs autorisées",
            "string.empty": "La forme juridique est requise",
            "any.required": "La forme juridique est requise",
        }),

    address: Joi.string()
        .min(5)
        .max(255)
        .pattern(/^[A-Za-zÀ-ÿ0-9\s,.-]+$/)
        .required()
        .messages({
            "string.base": "L'adresse doit être une chaîne de caractères",
            "string.min": "L'adresse doit contenir au moins 5 caractères",
            "string.max": "L'adresse ne peut pas dépasser 255 caractères",
            "string.empty": "L'adresse est requise",
            "string.pattern.base":
                "L'adresse contient des caractères non autorisés",
            "any.required": "L'adresse est requise",
        }),

    postal_code: Joi.string()
        .pattern(/^\d{5}$/)
        .required()
        .messages({
            "string.base": "Le code postal doit être une chaîne de caractères",
            "string.pattern.base":
                "Le code postal doit contenir exactement 5 chiffres",
            "string.empty": "Le code postal est requis",
            "any.required": "Le code postal est requis",
        }),

    city: Joi.string()
        .pattern(/^[A-Za-zÀ-ÿ\s-]{2,50}$/)
        .required()
        .messages({
            "string.base": "La ville doit être une chaîne de caractères",
            "string.pattern.base":
                "La ville doit contenir uniquement des lettres, espaces et tirets (entre 2 et 50 caractères)",
            "string.empty": "La ville est requise",
            "any.required": "La ville est requise",
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .max(100)
        .allow("")
        .optional()
        .messages({
            "string.base": "L'email doit être une chaîne de caractères",
            "string.email": "Format d'email invalide",
            "string.empty": "L'email est requis",
            "string.max": "L'email ne peut pas dépasser 100 caractères",
            "any.required": "L'email est requis",
        }),

    phone: Joi.string().pattern(phoneRegex).optional().allow("").messages({
        "string.base":
            "Le numéro de téléphone doit être une chaîne de caractères",
        "string.pattern.base":
            "Le numéro de téléphone doit être au format français (+33 ou 0 suivi de 9 chiffres)",
        "string.empty": "Le numéro de téléphone est requis",
    }),

    website: Joi.string()
        .uri({
            scheme: ["http", "https"],
        })
        .max(255)
        .allow(null, "")
        .optional()
        .messages({
            "string.base": "Le site web doit être une chaîne de caractères",
            "string.uri":
                "Le site web doit être une URL valide (commençant par http:// ou https://)",
            "string.max":
                "L'URL du site web ne peut pas dépasser 255 caractères",
            "string.empty": "Le site web est requis",
        }),

    country: Joi.string()
        .pattern(/^[A-Za-zÀ-ÿ\s-]{2,100}$/)
        .default("France")
        .messages({
            "string.base": "Le pays doit être une chaîne de caractères",
            "string.pattern.base":
                "Le pays doit contenir uniquement des lettres, espaces et tirets",
            "string.empty": "Le pays est requis",
        }),
});
