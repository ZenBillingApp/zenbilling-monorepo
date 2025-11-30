import { Router } from "express";
import { validateRequest } from "@zenbilling/shared";
import {
    generateDescriptionSchema,
    generateDescriptionSuggestionsSchema,
    improveDescriptionSchema,
    generateKeywordsSchema,
} from "../validations/ai-product.validation";
import { ProductController } from "../controllers/product.controller";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting pour les requêtes AI (plus restrictif)
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Maximum 10 requêtes AI par IP par fenêtre
    message: {
        success: false,
        message: "Trop de requêtes AI. Veuillez réessayer plus tard.",
        error: "RATE_LIMIT_EXCEEDED",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes IA pour génération de descriptions
router.post(
    "/ai/generate-description",
    aiRateLimit,
    validateRequest(generateDescriptionSchema),
    ProductController.generateProductDescription
);

router.post(
    "/ai/generate-suggestions",
    aiRateLimit,
    validateRequest(generateDescriptionSuggestionsSchema),
    ProductController.generateProductDescriptionSuggestions
);

router.post(
    "/ai/improve-description",
    aiRateLimit,
    validateRequest(improveDescriptionSchema),
    ProductController.improveProductDescription
);

router.post(
    "/ai/generate-keywords",
    aiRateLimit,
    validateRequest(generateKeywordsSchema),
    ProductController.generateProductKeywords
);

router.get("/ai/status", ProductController.checkAIService);

export default router;
