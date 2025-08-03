import Joi from "joi";

const passwordPattern =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "Email invalide",
        "string.empty": "Email requis",
        "any.required": "Email requis",
    }),
    password: Joi.string().min(8).pattern(passwordPattern).required().messages({
        "string.empty": "Mot de passe requis",
        "string.min": "Le mot de passe doit contenir au moins 8 caractères",
        "string.pattern.base":
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
        "any.required": "Mot de passe requis",
    }),
    first_name: Joi.string().min(2).required().messages({
        "string.empty": "Prénom requis",
        "string.min": "Le prénom doit contenir au moins 2 caractères",
        "any.required": "Prénom requis",
    }),
    last_name: Joi.string().min(2).required().messages({
        "string.empty": "Nom requis",
        "string.min": "Le nom doit contenir au moins 2 caractères",
        "any.required": "Nom requis",
    }),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.empty": "Email requis",
        "string.email": "Email invalide",
        "any.required": "Email requis",
    }),
    password: Joi.string().required().messages({
        "string.empty": "Mot de passe requis",
        "any.required": "Mot de passe requis",
    }),
});

export const updateProfileSchema = Joi.object({
    first_name: Joi.string().min(2).optional(),
    last_name: Joi.string().min(2).optional(),
    email: Joi.string().email().optional(),
});
