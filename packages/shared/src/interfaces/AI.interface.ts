export interface IGenerateDescriptionRequest {
    productName: string;
    category?: string;
    additionalInfo?: string;
}

export interface IGenerateDescriptionSuggestionsRequest {
    productName: string;
    category?: string;
    count?: number; // max 3
}

export interface IGenerateDescriptionResponse {
    description: string;
    generatedAt: Date;
    productName: string;
}

export interface IGenerateDescriptionSuggestionsResponse {
    suggestions: string[];
    generatedAt: Date;
    productName: string;
    count: number;
}
