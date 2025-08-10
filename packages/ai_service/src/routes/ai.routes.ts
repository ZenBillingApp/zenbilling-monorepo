import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import rateLimit from 'express-rate-limit';

const router = Router();
const aiController = new AIController();

// Rate limiting pour éviter les abus
const aiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum 100 requêtes par IP par fenêtre
    message: {
        success: false,
        message: 'Trop de requêtes AI. Veuillez réessayer plus tard.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting plus strict pour les opérations coûteuses
const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Maximum 20 requêtes par IP par fenêtre
    message: {
        success: false,
        message: 'Limite de requêtes atteinte pour cette opération. Veuillez réessayer plus tard.',
        error: 'STRICT_RATE_LIMIT_EXCEEDED'
    },
});

// Routes principales
router.get('/health', aiController.healthCheck);

// Génération de texte simple
router.post('/generate-text', aiRateLimit, aiController.generateText);

// Chat completion avec historique
router.post('/chat', strictRateLimit, aiController.chatCompletion);

// Génération de suggestions multiples
router.post('/suggestions', aiRateLimit, aiController.generateSuggestions);

// Amélioration de texte
router.post('/improve-text', aiRateLimit, aiController.improveText);

// Traduction
router.post('/translate', aiRateLimit, aiController.translateText);

// Résumé
router.post('/summarize', aiRateLimit, aiController.summarizeText);

export default router;