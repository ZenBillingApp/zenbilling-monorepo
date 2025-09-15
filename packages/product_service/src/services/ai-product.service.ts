import { AIClient } from "../clients/ai.client";
import { logger } from "@zenbilling/shared";
import {
    GenerateDescriptionRequest,
    GenerateDescriptionResponse,
    GenerateDescriptionSuggestionsRequest,
    GenerateDescriptionSuggestionsResponse,
} from "@zenbilling/shared";

export class AIProductService {
    private aiClient: AIClient;

    constructor() {
        this.aiClient = new AIClient();
    }

    /**
     * Génère une description de produit personnalisée pour les factures/devis français
     */
    async generateProductDescription(
        request: GenerateDescriptionRequest
    ): Promise<GenerateDescriptionResponse> {
        try {
            logger.info("Génération de description AI pour produit:", {
                productName: request.productName,
            });

            let prompt = `Génère une description professionnelle pour le produit : "${request.productName}"`;

            if (request.category) {
                prompt += `\nCatégorie : ${request.category}`;
            }

            if (request.additionalInfo) {
                prompt += `\nInformations supplémentaires : ${request.additionalInfo}`;
            }

            prompt +=
                "\n\nLa description doit être concise, professionnelle et adaptée à une facture ou un devis français. Maximum 100 mots.";

            const systemMessage =
                "Tu es un assistant spécialisé dans la création de descriptions de produits pour des factures et devis français. Génère des descriptions professionnelles, claires et concises adaptées au contexte commercial français.";

            const description = await this.aiClient.generateText({
                prompt,
                systemMessage,
                maxTokens: 150,
                temperature: 0.7,
            });

            console.log("description", description);

            const response: GenerateDescriptionResponse = {
                description,
                generatedAt: new Date(),
                productName: request.productName,
            };

            logger.info("Description AI générée avec succès:", {
                productName: request.productName,
                descriptionLength: description.length,
            });

            return response;
        } catch (error) {
            logger.error(
                "Erreur lors de la génération de description AI:",
                error
            );
            throw error;
        }
    }

    /**
     * Génère plusieurs suggestions de descriptions pour un produit
     */
    async generateProductDescriptionSuggestions(
        request: GenerateDescriptionSuggestionsRequest
    ): Promise<GenerateDescriptionSuggestionsResponse> {
        try {
            const count = Math.min(request.count || 3, 5); // Maximum 5 suggestions

            logger.info("Génération de suggestions AI pour produit:", {
                productName: request.productName,
                count,
            });

            let prompt = `Produit : "${request.productName}"`;

            if (request.category) {
                prompt += `\nCatégorie : ${request.category}`;
            }

            prompt += `\n\nGénère ${count} suggestions de descriptions courtes et professionnelles pour ce produit, adaptées à des factures françaises. Chaque description doit faire maximum 50 mots.`;

            const systemMessage =
                "Tu es un assistant spécialisé dans la création de descriptions de produits pour des factures et devis français. Génère plusieurs suggestions de descriptions courtes et professionnelles, chacune avec un angle différent.";

            const suggestions = await this.aiClient.generateSuggestions({
                prompt,
                count,
                systemMessage,
            });

            const response: GenerateDescriptionSuggestionsResponse = {
                suggestions,
                generatedAt: new Date(),
                productName: request.productName,
                count: suggestions.length,
            };

            logger.info("Suggestions AI générées avec succès:", {
                productName: request.productName,
                suggestionsCount: suggestions.length,
            });

            return response;
        } catch (error) {
            logger.error(
                "Erreur lors de la génération de suggestions AI:",
                error
            );
            throw error;
        }
    }

    /**
     * Améliore une description existante de produit
     */
    async improveProductDescription(
        productName: string,
        currentDescription: string,
        improvements?: string
    ): Promise<string> {
        try {
            logger.info("Amélioration de description AI pour produit:", {
                productName,
            });

            const instructions = improvements
                ? `Améliore cette description de produit selon ces directives : ${improvements}`
                : "Améliore cette description de produit pour qu'elle soit plus professionnelle, claire et adaptée à une facture française";

            const improvedDescription = await this.aiClient.improveText(
                currentDescription,
                instructions
            );

            logger.info("Description AI améliorée avec succès:", {
                productName,
                originalLength: currentDescription.length,
                improvedLength: improvedDescription.length,
            });

            return improvedDescription;
        } catch (error) {
            logger.error(
                "Erreur lors de l'amélioration de description AI:",
                error
            );
            throw error;
        }
    }

    /**
     * Génère des mots-clés pour un produit (pour la recherche)
     */
    async generateProductKeywords(
        productName: string,
        description?: string
    ): Promise<string[]> {
        try {
            logger.info("Génération de mots-clés AI pour produit:", {
                productName,
            });

            let prompt = `Génère 5-8 mots-clés pertinents pour le produit : "${productName}"`;

            if (description) {
                prompt += `\nDescription : ${description}`;
            }

            prompt +=
                "\n\nLes mots-clés doivent être en français et pertinents pour la recherche dans un catalogue de produits.";

            const systemMessage =
                "Tu es spécialisé dans la génération de mots-clés pour l'optimisation de recherche de produits. Génère des mots-clés pertinents en français.";

            const keywordsText = await this.aiClient.generateText({
                prompt,
                systemMessage,
                maxTokens: 100,
                temperature: 0.5,
            });

            // Parser les mots-clés (supposés être séparés par des virgules ou des retours à la ligne)
            const keywords = keywordsText
                .split(/[,\n]/)
                .map((k) => k.trim())
                .filter((k) => k.length > 0)
                .slice(0, 8); // Maximum 8 mots-clés

            logger.info("Mots-clés AI générés avec succès:", {
                productName,
                keywordsCount: keywords.length,
            });

            return keywords;
        } catch (error) {
            logger.error(
                "Erreur lors de la génération de mots-clés AI:",
                error
            );
            throw error;
        }
    }

    /**
     * Vérifie la disponibilité du service AI
     */
    async isAIServiceAvailable(): Promise<boolean> {
        try {
            return await this.aiClient.healthCheck();
        } catch (error) {
            logger.warn("Service AI non disponible:", error);
            return false;
        }
    }
}
