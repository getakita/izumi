import { LLMConfig, Message, EmbeddingResponse } from '../types/index.js';
/**
 * LLM implementation using Vercel AI SDK
 * Supports multiple providers: OpenAI, Anthropic, Google, Mistral, Cohere
 */
export declare class VercelAIChat {
    private config;
    private model;
    private embeddingModel;
    constructor(config: LLMConfig);
    private initializeAsync;
    /**
     * Check if the model is fully initialized and ready to use
     */
    isInitialized(): boolean;
    /**
     * Wait for model initialization to complete
     */
    waitForInitialization(): Promise<void>;
    private createModel;
    private createEmbeddingModel;
    submitPrompt(messages: Message[]): Promise<string>;
    generateEmbedding(text: string): Promise<EmbeddingResponse>;
    private simpleEmbedding;
    private hashString;
    updateConfig(newConfig: Partial<LLMConfig>): Promise<void>;
    getConfig(): LLMConfig;
}
//# sourceMappingURL=VercelAIChat.d.ts.map