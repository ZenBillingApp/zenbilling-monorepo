import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export class OpenAIConfig {
    private static instance: OpenAI;

    public static getInstance(): OpenAI {
        if (!OpenAIConfig.instance) {
            const apiKey = process.env.OPENAI_API_KEY;

            if (!apiKey) {
                throw new Error(
                    "OPENAI_API_KEY environment variable is required"
                );
            }

            OpenAIConfig.instance = new OpenAI({
                apiKey: apiKey,
            });
        }

        return OpenAIConfig.instance;
    }

    public static getModel(): string {
        return process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    }

    public static getMaxTokens(): number {
        return parseInt(process.env.OPENAI_MAX_TOKENS || "500");
    }

    public static getTemperature(): number {
        return parseFloat(process.env.OPENAI_TEMPERATURE || "0.7");
    }
}
