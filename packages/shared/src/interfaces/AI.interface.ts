// export interface IGenerateDescriptionRequest {
//     productName: string;
//     category?: string;
//     additionalInfo?: string;
// }

// export interface IGenerateDescriptionSuggestionsRequest {
//     productName: string;
//     category?: string;
//     count?: number; // max 3
// }

// export interface IGenerateDescriptionResponse {
//     description: string;
//     generatedAt: Date;
//     productName: string;
// }

// export interface IGenerateDescriptionSuggestionsResponse {
//     suggestions: string[];
//     generatedAt: Date;
//     productName: string;
//     count: number;
// }

export interface GenerateDescriptionRequest {
    productName: string;
    category?: string;
    additionalInfo?: string;
}

export interface GenerateDescriptionSuggestionsRequest {
    productName: string;
    category?: string;
    count?: number; // max 5
}

export interface GenerateDescriptionResponse {
    description: string;
    generatedAt: Date;
    productName: string;
}

export interface GenerateDescriptionSuggestionsResponse {
    suggestions: string[];
    generatedAt: Date;
    productName: string;
    count: number;
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatCompletionRequest {
    messages: ChatMessage[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface ChatCompletionResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    finishReason?: string;
}

export interface TextGenerationRequest {
    prompt: string;
    systemMessage?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface AISuggestionsRequest {
    prompt: string;
    count?: number;
    systemMessage?: string;
}

export interface AIResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
}
