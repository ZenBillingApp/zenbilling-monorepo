import { OpenAIConfig } from "../config/openai.config";
import {
    ChatMessage,
    ChatCompletionRequest,
    ChatCompletionResponse,
    TextGenerationRequest,
} from "@zenbilling/shared/src/interfaces/AI.interface";

export class AIService {
    private openai = OpenAIConfig.getInstance();

    /**
     * Génère du texte à partir d'un prompt simple
     */
    async generateText(request: TextGenerationRequest): Promise<string> {
        try {
            const messages: ChatMessage[] = [];

            if (request.systemMessage) {
                messages.push({
                    role: "system",
                    content: request.systemMessage,
                });
            }

            messages.push({
                role: "user",
                content: request.prompt,
            });

            const completion = await this.openai.chat.completions.create({
                model: request.model || OpenAIConfig.getModel(),
                messages,
                max_tokens: request.maxTokens || OpenAIConfig.getMaxTokens(),
                temperature:
                    request.temperature || OpenAIConfig.getTemperature(),
            });

            return completion.choices[0]?.message?.content?.trim() || "";
        } catch (error) {
            console.error("Erreur lors de la génération de texte:", error);
            throw new Error("Impossible de générer le texte");
        }
    }

    /**
     * Chat completion avec historique de messages
     */
    async chatCompletion(
        request: ChatCompletionRequest
    ): Promise<ChatCompletionResponse> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: request.model || OpenAIConfig.getModel(),
                messages: request.messages,
                max_tokens: request.maxTokens || OpenAIConfig.getMaxTokens(),
                temperature:
                    request.temperature || OpenAIConfig.getTemperature(),
            });

            const choice = completion.choices[0];

            return {
                content: choice?.message?.content?.trim() || "",
                usage: completion.usage
                    ? {
                          promptTokens: completion.usage.prompt_tokens,
                          completionTokens: completion.usage.completion_tokens,
                          totalTokens: completion.usage.total_tokens,
                      }
                    : undefined,
                model: completion.model,
                finishReason: choice?.finish_reason || undefined,
            };
        } catch (error) {
            console.error("Erreur lors du chat completion:", error);
            throw new Error("Impossible de traiter la demande de chat");
        }
    }

    /**
     * Génère des suggestions multiples pour un prompt donné
     */
    async generateSuggestions(
        prompt: string,
        count: number = 3,
        systemMessage?: string
    ): Promise<string[]> {
        try {
            const adjustedPrompt = `${prompt}\n\nGénère ${count} suggestions différentes. Format : une suggestion par ligne, précédée d'un numéro (1., 2., 3.).`;

            const text = await this.generateText({
                prompt: adjustedPrompt,
                systemMessage,
                temperature: OpenAIConfig.getTemperature() + 0.2, // Plus de créativité pour les suggestions
            });

            return this.parseSuggestions(text, count);
        } catch (error) {
            console.error(
                "Erreur lors de la génération de suggestions:",
                error
            );
            throw new Error("Impossible de générer les suggestions");
        }
    }

    /**
     * Analyse et améliore un texte existant
     */
    async improveText(
        text: string,
        instructions: string = "Améliore ce texte"
    ): Promise<string> {
        try {
            const prompt = `${instructions}\n\nTexte original : "${text}"`;

            return await this.generateText({
                prompt,
                systemMessage:
                    "Tu es un assistant spécialisé dans l'amélioration de textes. Fournis une version améliorée claire et professionnelle.",
            });
        } catch (error) {
            console.error("Erreur lors de l'amélioration du texte:", error);
            throw new Error("Impossible d'améliorer le texte");
        }
    }

    /**
     * Traduit un texte
     */
    async translateText(
        text: string,
        targetLanguage: string = "français"
    ): Promise<string> {
        try {
            const prompt = `Traduis ce texte en ${targetLanguage} : "${text}"`;

            return await this.generateText({
                prompt,
                systemMessage: `Tu es un traducteur professionnel. Traduis le texte en ${targetLanguage} en gardant le sens et le ton original.`,
            });
        } catch (error) {
            console.error("Erreur lors de la traduction:", error);
            throw new Error("Impossible de traduire le texte");
        }
    }

    /**
     * Résume un texte
     */
    async summarizeText(text: string, maxWords: number = 100): Promise<string> {
        try {
            const prompt = `Résume ce texte en maximum ${maxWords} mots : "${text}"`;

            return await this.generateText({
                prompt,
                systemMessage:
                    "Tu es spécialisé dans la création de résumés concis et précis.",
            });
        } catch (error) {
            console.error("Erreur lors du résumé:", error);
            throw new Error("Impossible de résumer le texte");
        }
    }

    /**
     * Parse les suggestions depuis le texte généré
     */
    private parseSuggestions(content: string, maxCount: number): string[] {
        const lines = content.split("\n").filter((line) => line.trim());
        const suggestions: string[] = [];

        for (const line of lines) {
            // Enlever les numéros en début de ligne (1., 2., 3., etc.)
            const cleaned = line.replace(/^\d+\.\s*/, "").trim();
            if (cleaned && suggestions.length < maxCount) {
                suggestions.push(cleaned);
            }
        }

        // Si on n'a pas réussi à parser correctement, on divise le contenu
        if (suggestions.length === 0) {
            const parts = content
                .split(/[\n\r]+/)
                .filter((part) => part.trim());
            return parts.slice(0, maxCount);
        }

        return suggestions;
    }
}
