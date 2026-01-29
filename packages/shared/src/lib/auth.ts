import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, jwt } from "better-auth/plugins";
import prisma from "./prisma";
import { z } from "zod";

// Schéma Zod pour les champs additionnels de l'organisation
const organizationFieldsSchema = z.object({
    siret: z
        .string({
            required_error: "Le SIRET est requis",
        })
        .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
    tva_intra: z
        .string()
        .regex(
            /^FR[0-9A-Z]{2}[0-9]{9}$/,
            "La TVA intracommunautaire doit être au format FR + 11 caractères",
        )
        .optional()
        .nullable(),
    tva_applicable: z.boolean({
        required_error: "La TVA applicable est requise",
    }),
    RCS_number: z
        .string({
            required_error: "Le numéro RCS est requis",
        })
        .regex(
            /^[A-Za-z0-9\s-]{1,50}$/,
            "Le numéro RCS doit contenir uniquement des lettres, chiffres, espaces et tirets (max 50 caractères)",
        ),
    RCS_city: z
        .string({
            required_error: "La ville RCS est requise",
        })
        .regex(
            /^[A-Za-zÀ-ÿ\s-]{2,50}$/,
            "La ville RCS doit contenir uniquement des lettres, espaces et tirets (entre 2 et 50 caractères)",
        ),
    capital: z
        .number({
            invalid_type_error: "Le capital doit être un nombre",
        })
        .min(0, "Le capital doit être supérieur à 0")
        .max(999999999.99, "Le capital ne peut pas dépasser 999 999 999,99")
        .optional()
        .nullable(),
    siren: z
        .string({
            required_error: "Le SIREN est requis",
        })
        .regex(/^\d{9}$/, "Le SIREN doit contenir exactement 9 chiffres"),
    legal_form: z.enum(
        [
            "SAS",
            "SARL",
            "SA",
            "SASU",
            "EURL",
            "SNC",
            "SOCIETE_CIVILE",
            "ENTREPRISE_INDIVIDUELLE",
        ],
        {
            errorMap: () => ({
                message:
                    "Forme juridique invalide - doit être l'une des valeurs autorisées",
            }),
        },
    ),
    address: z
        .string({
            required_error: "L'adresse est requise",
        })
        .min(5, "L'adresse doit contenir au moins 5 caractères")
        .max(255, "L'adresse ne peut pas dépasser 255 caractères")
        .regex(
            /^[A-Za-zÀ-ÿ0-9\s,.-]+$/,
            "L'adresse contient des caractères non autorisés",
        ),
    postal_code: z
        .string({
            required_error: "Le code postal est requis",
        })
        .regex(/^\d{5}$/, "Le code postal doit contenir exactement 5 chiffres"),
    city: z
        .string({
            required_error: "La ville est requise",
        })
        .regex(
            /^[A-Za-zÀ-ÿ\s-]{2,50}$/,
            "La ville doit contenir uniquement des lettres, espaces et tirets (entre 2 et 50 caractères)",
        ),
    country: z
        .string()
        .regex(
            /^[A-Za-zÀ-ÿ\s-]{2,100}$/,
            "Le pays doit contenir uniquement des lettres, espaces et tirets",
        )
        .default("France"),
    email: z
        .string()
        .email("Format d'email invalide")
        .max(100, "L'email ne peut pas dépasser 100 caractères")
        .optional()
        .nullable(),
    phone: z
        .string()
        .regex(
            /^(\+33|0)[1-9](\d{2}){4}$/,
            "Le numéro de téléphone doit être au format français (+33 ou 0 suivi de 9 chiffres)",
        )
        .optional()
        .nullable(),
    website: z
        .string()
        .url(
            "Le site web doit être une URL valide (commençant par http:// ou https://)",
        )
        .max(255, "L'URL du site web ne peut pas dépasser 255 caractères")
        .optional()
        .nullable(),
    stripe_account_id: z
        .string()
        .max(255, "L'ID du compte Stripe ne peut pas dépasser 255 caractères")
        .optional()
        .nullable(),
    stripe_onboarded: z
        .boolean({
            invalid_type_error: "stripe_onboarded doit être un booléen",
        })
        .default(false),
});

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            mapProfileToUser: (profile) => {
                return {
                    first_name: profile.given_name,
                    last_name: profile.family_name,
                };
            },
        },
    },
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
    secretKey: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
        process.env.CLIENT_URL || "http://localhost:3000",
        process.env.API_GATEWAY_URL || "http://localhost:8080",
    ],
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            domain: process.env.COOKIE_DOMAIN || undefined,
        },
    },

    user: {
        additionalFields: {
            first_name: {
                type: "string",
                required: true,
            },
            last_name: {
                type: "string",
                required: true,
            },
        },
    },
    plugins: [
        nextCookies(),
        // Plugin JWT pour génération de tokens validables par le Gateway
        jwt({
            jwt: {
                issuer: process.env.BETTER_AUTH_URL || "http://localhost:3001",
                audience:
                    process.env.API_GATEWAY_URL || "http://localhost:8080",
                // Inclure les données de session dans le JWT
                definePayload: ({ user, session }) => {
                    return {
                        // User claims
                        id: user.id,
                        email: user.email,
                        name: `${user.first_name} ${user.last_name}`,
                        sessionId: session.id,
                        activeOrganizationId:
                            session.activeOrganizationId || null,
                    };
                },
            },
        }),
        organization({
            schema: {
                organization: {
                    additionalFields: {
                        siret: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape.siret,
                            },
                        },
                        tva_intra: {
                            type: "string",
                            required: false,
                            validator: {
                                input: organizationFieldsSchema.shape.tva_intra,
                            },
                        },
                        tva_applicable: {
                            type: "boolean",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape
                                    .tva_applicable,
                            },
                        },
                        RCS_number: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape
                                    .RCS_number,
                            },
                        },
                        RCS_city: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape.RCS_city,
                            },
                        },
                        capital: {
                            type: "number",
                            required: false,
                            validator: {
                                input: organizationFieldsSchema.shape.capital,
                            },
                        },
                        siren: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape.siren,
                            },
                        },
                        legal_form: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape
                                    .legal_form,
                            },
                        },
                        address: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape.address,
                            },
                        },
                        postal_code: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape
                                    .postal_code,
                            },
                        },
                        city: {
                            type: "string",
                            required: true,
                            validator: {
                                input: organizationFieldsSchema.shape.city,
                            },
                        },
                        country: {
                            type: "string",
                            required: true,
                            defaultValue: "France",
                            validator: {
                                input: organizationFieldsSchema.shape.country,
                            },
                        },
                        email: {
                            type: "string",
                            required: false,
                            validator: {
                                input: organizationFieldsSchema.shape.email,
                            },
                        },
                        phone: {
                            type: "string",
                            required: false,
                            validator: {
                                input: organizationFieldsSchema.shape.phone,
                            },
                        },
                        website: {
                            type: "string",
                            required: false,
                            validator: {
                                input: organizationFieldsSchema.shape.website,
                            },
                        },
                        stripe_account_id: {
                            type: "string",
                            required: false,
                            validator: {
                                input: organizationFieldsSchema.shape
                                    .stripe_account_id,
                            },
                        },
                        stripe_onboarded: {
                            type: "boolean",
                            required: false,
                            defaultValue: false,
                            validator: {
                                input: organizationFieldsSchema.shape
                                    .stripe_onboarded,
                            },
                        },
                    },
                },
            },
        }),
    ],
});
