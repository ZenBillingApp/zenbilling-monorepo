import { Request, Response } from 'express';
import { AIService, ChatMessage } from '../services/ai.service';
import { apiResponse } from '@zenbilling/shared';

export class AIController {
    private aiService = new AIService();

    /**
     * Génère du texte simple à partir d'un prompt
     */
    generateText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { prompt, systemMessage, model, maxTokens, temperature } = req.body;

            if (!prompt) {
                res.status(400).json(apiResponse.error('Le prompt est requis', 400));
                return;
            }

            const result = await this.aiService.generateText({
                prompt,
                systemMessage,
                model,
                maxTokens,
                temperature
            });

            res.json(apiResponse.success(result, 'Texte généré avec succès'));
        } catch (error) {
            console.error('Erreur lors de la génération de texte:', error);
            res.status(500).json(apiResponse.error('Erreur lors de la génération de texte', 500));
        }
    };

    /**
     * Chat completion avec historique
     */
    chatCompletion = async (req: Request, res: Response): Promise<void> => {
        try {
            const { messages, model, maxTokens, temperature } = req.body;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                res.status(400).json(apiResponse.error('Les messages sont requis', 400));
                return;
            }

            // Validation des messages
            for (const message of messages) {
                if (!message.role || !message.content) {
                    res.status(400).json(apiResponse.error('Chaque message doit avoir un role et un content', 400));
                    return;
                }
                if (!['system', 'user', 'assistant'].includes(message.role)) {
                    res.status(400).json(apiResponse.error('Le role doit être system, user ou assistant', 400));
                    return;
                }
            }

            const result = await this.aiService.chatCompletion({
                messages: messages as ChatMessage[],
                model,
                maxTokens,
                temperature
            });

            res.json(apiResponse.success(result, 'Chat completion réalisé avec succès'));
        } catch (error) {
            console.error('Erreur lors du chat completion:', error);
            res.status(500).json(apiResponse.error('Erreur lors du chat completion', 500));
        }
    };

    /**
     * Génère plusieurs suggestions
     */
    generateSuggestions = async (req: Request, res: Response): Promise<void> => {
        try {
            const { prompt, count = 3, systemMessage } = req.body;

            if (!prompt) {
                res.status(400).json(apiResponse.error('Le prompt est requis', 400));
                return;
            }

            if (count > 5) {
                res.status(400).json(apiResponse.error('Le nombre de suggestions ne peut pas dépasser 5', 400));
                return;
            }

            const suggestions = await this.aiService.generateSuggestions(prompt, count, systemMessage);

            res.json(apiResponse.success({
                suggestions,
                count: suggestions.length,
                prompt
            }, 'Suggestions générées avec succès'));
        } catch (error) {
            console.error('Erreur lors de la génération de suggestions:', error);
            res.status(500).json(apiResponse.error('Erreur lors de la génération de suggestions', 500));
        }
    };

    /**
     * Améliore un texte existant
     */
    improveText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, instructions = "Améliore ce texte" } = req.body;

            if (!text) {
                res.status(400).json(apiResponse.error('Le texte à améliorer est requis', 400));
                return;
            }

            const improvedText = await this.aiService.improveText(text, instructions);

            res.json(apiResponse.success({
                originalText: text,
                improvedText,
                instructions
            }, 'Texte amélioré avec succès'));
        } catch (error) {
            console.error('Erreur lors de l\'amélioration du texte:', error);
            res.status(500).json(apiResponse.error('Erreur lors de l\'amélioration du texte', 500));
        }
    };

    /**
     * Traduit un texte
     */
    translateText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, targetLanguage = "français" } = req.body;

            if (!text) {
                res.status(400).json(apiResponse.error('Le texte à traduire est requis', 400));
                return;
            }

            const translatedText = await this.aiService.translateText(text, targetLanguage);

            res.json(apiResponse.success({
                originalText: text,
                translatedText,
                targetLanguage
            }, 'Texte traduit avec succès'));
        } catch (error) {
            console.error('Erreur lors de la traduction:', error);
            res.status(500).json(apiResponse.error('Erreur lors de la traduction', 500));
        }
    };

    /**
     * Résume un texte
     */
    summarizeText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, maxWords = 100 } = req.body;

            if (!text) {
                res.status(400).json(apiResponse.error('Le texte à résumer est requis', 400));
                return;
            }

            const summary = await this.aiService.summarizeText(text, maxWords);

            res.json(apiResponse.success({
                originalText: text,
                summary,
                maxWords
            }, 'Texte résumé avec succès'));
        } catch (error) {
            console.error('Erreur lors du résumé:', error);
            res.status(500).json(apiResponse.error('Erreur lors du résumé', 500));
        }
    };

    /**
     * Health check pour vérifier le statut du service
     */
    healthCheck = async (req: Request, res: Response): Promise<void> => {
        try {
            // Test simple avec OpenAI
            const testResult = await this.aiService.generateText({
                prompt: "Dis juste 'OK'",
                maxTokens: 10
            });

            res.json(apiResponse.success({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                openaiConnected: testResult.includes('OK')
            }, 'Service AI opérationnel'));
        } catch (error) {
            console.error('Erreur lors du health check:', error);
            res.status(503).json(apiResponse.error('Service AI non disponible', 503));
        }
    };
}