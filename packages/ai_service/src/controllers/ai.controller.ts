import { Request, Response } from "express";
import { AIService } from "../services/ai.service";
import { ApiResponse } from "@zenbilling/shared";
import { ChatMessage } from "@zenbilling/shared";

export class AIController {
    private aiService = new AIService();

    /**
     * Génère du texte simple à partir d'un prompt
     */
    generateText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { prompt, systemMessage, model, maxTokens, temperature } =
                req.body;

            if (!prompt) {
                ApiResponse.error(res, 400, "Le prompt est requis");
                return;
            }

            const result = await this.aiService.generateText({
                prompt,
                systemMessage,
                model,
                maxTokens,
                temperature,
            });

            ApiResponse.success(res, 200, "Texte généré avec succès", result);
        } catch (error) {
            console.error("Erreur lors de la génération de texte:", error);

            ApiResponse.error(
                res,
                500,
                "Erreur lors de la génération de texte"
            );
        }
    };

    /**
     * Chat completion avec historique
     */
    chatCompletion = async (req: Request, res: Response): Promise<void> => {
        try {
            const { messages, model, maxTokens, temperature } = req.body;

            if (
                !messages ||
                !Array.isArray(messages) ||
                messages.length === 0
            ) {
                ApiResponse.error(res, 400, "Les messages sont requis");
                return;
            }

            // Validation des messages
            for (const message of messages) {
                if (!message.role || !message.content) {
                    ApiResponse.error(
                        res,
                        400,
                        "Chaque message doit avoir un role et un content"
                    );
                    return;
                }
                if (!["system", "user", "assistant"].includes(message.role)) {
                    ApiResponse.error(
                        res,
                        400,
                        "Le role doit être system, user ou assistant"
                    );
                    return;
                }
            }

            const result = await this.aiService.chatCompletion({
                messages: messages as ChatMessage[],
                model,
                maxTokens,
                temperature,
            });

            ApiResponse.success(
                res as Response,
                200,
                "Chat completion réalisé avec succès",
                result
            );
        } catch (error) {
            console.error("Erreur lors du chat completion:", error);
            ApiResponse.error(res, 500, "Erreur lors du chat completion");
        }
    };

    /**
     * Génère plusieurs suggestions
     */
    generateSuggestions = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { prompt, count = 3, systemMessage } = req.body;

            if (!prompt) {
                ApiResponse.error(res, 400, "Le prompt est requis");
                return;
            }

            if (count > 5) {
                ApiResponse.error(
                    res,
                    400,
                    "Le nombre de suggestions ne peut pas dépasser 5"
                );
                return;
            }

            const suggestions = await this.aiService.generateSuggestions(
                prompt,
                count,
                systemMessage
            );

            ApiResponse.success(res, 200, "Suggestions générées avec succès", {
                suggestions,
                count: suggestions.length,
                prompt,
            });
        } catch (error) {
            console.error(
                "Erreur lors de la génération de suggestions:",
                error
            );

            ApiResponse.error(
                res,
                500,
                "Erreur lors de la génération de suggestions"
            );
        }
    };

    /**
     * Améliore un texte existant
     */
    improveText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, instructions = "Améliore ce texte" } = req.body;

            if (!text) {
                ApiResponse.error(res, 400, "Le texte à améliorer est requis");
                return;
            }

            const improvedText = await this.aiService.improveText(
                text,
                instructions
            );

            ApiResponse.success(res, 200, "Texte amélioré avec succès", {
                originalText: text,
                improvedText,
                instructions,
            });
        } catch (error) {
            console.error("Erreur lors de l'amélioration du texte:", error);

            ApiResponse.error(
                res,
                500,
                "Erreur lors de l'amélioration du texte"
            );
        }
    };

    /**
     * Traduit un texte
     */
    translateText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, targetLanguage = "français" } = req.body;

            if (!text) {
                ApiResponse.error(res, 400, "Le texte à traduire est requis");
                return;
            }

            const translatedText = await this.aiService.translateText(
                text,
                targetLanguage
            );

            ApiResponse.success(res, 200, "Texte traduit avec succès", {
                originalText: text,
                translatedText,
                targetLanguage,
            });
        } catch (error) {
            console.error("Erreur lors de la traduction:", error);
            ApiResponse.error(res, 500, "Erreur lors de la traduction");
        }
    };

    /**
     * Résume un texte
     */
    summarizeText = async (req: Request, res: Response): Promise<void> => {
        try {
            const { text, maxWords = 100 } = req.body;

            if (!text) {
                ApiResponse.error(res, 400, "Le texte à résumer est requis");
                return;
            }

            const summary = await this.aiService.summarizeText(text, maxWords);

            ApiResponse.success(res, 200, "Texte résumé avec succès", {
                originalText: text,
                summary,
                maxWords,
            });
        } catch (error) {
            console.error("Erreur lors du résumé:", error);
            ApiResponse.error(res, 500, "Erreur lors du résumé");
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
                maxTokens: 10,
            });

            ApiResponse.success(res, 200, "Service AI opérationnel", {
                status: "healthy",
                timestamp: new Date().toISOString(),
                openaiConnected: testResult.includes("OK"),
            });
        } catch (error) {
            console.error("Erreur lors du health check:", error);
            ApiResponse.error(res, 503, "Service AI non disponible");
        }
    };
}
