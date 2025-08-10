import axios, { AxiosInstance, AxiosResponse } from "axios";
import { logger } from "@zenbilling/shared";
import {
    TextGenerationRequest,
    AISuggestionsRequest,
    AIResponse,
} from "@zenbilling/shared/src/interfaces/AI.interface";
import dotenv from "dotenv";

dotenv.config();

export class AIClient {
    private client: AxiosInstance;

    constructor() {
        const aiServiceUrl =
            process.env.AI_SERVICE_URL || "http://localhost:3011";

        this.client = axios.create({
            baseURL: aiServiceUrl,
            timeout: 30000, // 30 secondes pour les requêtes AI
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Intercepteur pour logger les requêtes
        this.client.interceptors.request.use(
            (config) => {
                logger.info(
                    `AI Service Request: ${config.method?.toUpperCase()} ${
                        config.url
                    }`
                );
                return config;
            },
            (error) => {
                logger.error("AI Service Request Error:", error);
                return Promise.reject(error);
            }
        );

        // Intercepteur pour logger les réponses
        this.client.interceptors.response.use(
            (response) => {
                logger.info(
                    `AI Service Response: ${response.status} ${response.config.url}`
                );
                return response;
            },
            (error) => {
                logger.error(
                    "AI Service Response Error:",
                    error.response?.data || error.message
                );
                return Promise.reject(error);
            }
        );
    }

    /**
     * Génère du texte via le service AI
     */
    async generateText(request: TextGenerationRequest): Promise<string> {
        try {
            const response: AxiosResponse<AIResponse<string>> =
                await this.client.post("/api/ai/generate-text", request);

            if (!response.data.success) {
                throw new Error(
                    response.data.message ||
                        "Erreur lors de la génération de texte"
                );
            }

            return response.data.data;
        } catch (error) {
            logger.error("Erreur lors de la génération de texte:", error);
            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNREFUSED") {
                    throw new Error("Service AI non disponible");
                }
                if (error.response?.status === 429) {
                    throw new Error(
                        "Limite de requêtes atteinte. Veuillez réessayer plus tard."
                    );
                }
                if (error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
            }
            throw new Error("Impossible de générer le texte");
        }
    }

    /**
     * Génère des suggestions multiples via le service AI
     */
    async generateSuggestions(
        request: AISuggestionsRequest
    ): Promise<string[]> {
        try {
            const response: AxiosResponse<
                AIResponse<{
                    suggestions: string[];
                    count: number;
                    prompt: string;
                }>
            > = await this.client.post("/api/ai/suggestions", request);

            if (!response.data.success) {
                throw new Error(
                    response.data.message ||
                        "Erreur lors de la génération de suggestions"
                );
            }

            return response.data.data.suggestions;
        } catch (error) {
            logger.error("Erreur lors de la génération de suggestions:", error);
            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNREFUSED") {
                    throw new Error("Service AI non disponible");
                }
                if (error.response?.status === 429) {
                    throw new Error(
                        "Limite de requêtes atteinte. Veuillez réessayer plus tard."
                    );
                }
                if (error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
            }
            throw new Error("Impossible de générer les suggestions");
        }
    }

    /**
     * Améliore un texte existant
     */
    async improveText(text: string, instructions?: string): Promise<string> {
        try {
            const response: AxiosResponse<
                AIResponse<{ improvedText: string }>
            > = await this.client.post("/api/ai/improve-text", {
                text,
                instructions,
            });

            if (!response.data.success) {
                throw new Error(
                    response.data.message ||
                        "Erreur lors de l'amélioration du texte"
                );
            }

            return response.data.data.improvedText;
        } catch (error) {
            logger.error("Erreur lors de l'amélioration du texte:", error);
            if (axios.isAxiosError(error)) {
                if (error.code === "ECONNREFUSED") {
                    throw new Error("Service AI non disponible");
                }
                if (error.response?.status === 429) {
                    throw new Error(
                        "Limite de requêtes atteinte. Veuillez réessayer plus tard."
                    );
                }
                if (error.response?.data?.message) {
                    throw new Error(error.response.data.message);
                }
            }
            throw new Error("Impossible d'améliorer le texte");
        }
    }

    /**
     * Health check du service AI
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get("/api/ai/health");
            return response.status === 200 && response.data.success;
        } catch (error) {
            logger.warn("Service AI health check failed:", error);
            return false;
        }
    }
}
