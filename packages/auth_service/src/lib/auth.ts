import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import dotenv from "dotenv";

dotenv.config();

import { prisma } from "@zenbilling/shared";

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
        "https://zenbilling-dev.dynamicwebforge.fr",
        "https://zenbillingapi-dev.dynamicwebforge.fr",
        "https://zenbilling.dynamicwebforge.fr",
        "https://zenbillingapi.dynamicwebforge.fr",
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
            company_id: {
                type: "string",
                required: false,
            },
            onboarding_completed: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            onboarding_step: {
                type: "string",
                required: false,
            },
            stripe_onboarded: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            stripe_account_id: {
                type: "string",
                required: false,
            },
        },
    },
    plugins: [nextCookies()],
});
