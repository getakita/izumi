import { generateText, embed } from 'ai';
/**
 * LLM implementation using Vercel AI SDK
 * Supports multiple providers: OpenAI, Anthropic, Google, Mistral, Cohere
 */
export class VercelAIChat {
    config;
    model = null;
    embeddingModel = null;
    constructor(config) {
        this.config = config;
        this.initializeAsync();
    }
    async initializeAsync() {
        this.model = await this.createModel();
        this.embeddingModel = await this.createEmbeddingModel();
    }
    /**
     * Check if the model is fully initialized and ready to use
     */
    isInitialized() {
        return this.model !== null;
    }
    /**
     * Wait for model initialization to complete
     */
    async waitForInitialization() {
        while (!this.isInitialized()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    async createModel() {
        const { provider, model: modelName, apiKey, baseURL } = this.config;
        switch (provider) {
            case 'openai': {
                const { openai } = await import('@ai-sdk/openai');
                return openai(modelName || 'gpt-4o-mini');
            }
            case 'anthropic': {
                const { anthropic } = await import('@ai-sdk/anthropic');
                return anthropic(modelName || 'claude-3-5-sonnet-20241022');
            }
            case 'google': {
                const { google } = await import('@ai-sdk/google');
                return google(modelName || 'gemini-1.5-pro');
            }
            case 'mistral': {
                const { mistral } = await import('@ai-sdk/mistral');
                return mistral(modelName || 'mistral-large-latest');
            }
            case 'cohere': {
                const { cohere } = await import('@ai-sdk/cohere');
                return cohere(modelName || 'command-r-plus');
            }
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }
    async createEmbeddingModel() {
        const { provider, apiKey, baseURL } = this.config;
        try {
            switch (provider) {
                case 'openai': {
                    const { openai } = await import('@ai-sdk/openai');
                    return openai.embedding('text-embedding-3-small');
                }
                case 'google': {
                    const { google } = await import('@ai-sdk/google');
                    return google.textEmbeddingModel('text-embedding-004');
                }
                // Other providers don't have embedding support in AI SDK yet
                case 'anthropic':
                case 'mistral':
                case 'cohere':
                default:
                    console.warn(`Embedding not supported for provider: ${provider}. Using fallback.`);
                    return null;
            }
        }
        catch (error) {
            console.warn(`Failed to create embedding model for ${provider}. Using fallback.`);
            return null;
        }
    }
    async submitPrompt(messages) {
        if (!this.model) {
            throw new Error('Model not initialized. Please wait for initialization to complete.');
        }
        try {
            const result = await generateText({
                model: this.model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                temperature: this.config.temperature ?? 0.1,
                maxTokens: this.config.maxTokens ?? 1000,
            });
            return result.text;
        }
        catch (error) {
            throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateEmbedding(text) {
        try {
            if (this.embeddingModel) {
                // Use AI SDK for embeddings
                const result = await embed({
                    model: this.embeddingModel,
                    value: text,
                });
                return {
                    embedding: result.embedding,
                    usage: {
                        promptTokens: result.usage?.tokens || Math.ceil(text.length / 4),
                        totalTokens: result.usage?.tokens || Math.ceil(text.length / 4),
                    },
                };
            }
            else {
                // Fallback to simple hash-based embedding
                const embedding = this.simpleEmbedding(text);
                return {
                    embedding,
                    usage: {
                        promptTokens: Math.ceil(text.length / 4),
                        totalTokens: Math.ceil(text.length / 4),
                    },
                };
            }
        }
        catch (error) {
            console.warn(`Embedding generation failed, using fallback: ${error}`);
            // Fallback to simple embedding
            const embedding = this.simpleEmbedding(text);
            return {
                embedding,
                usage: {
                    promptTokens: Math.ceil(text.length / 4),
                    totalTokens: Math.ceil(text.length / 4),
                },
            };
        }
    }
    simpleEmbedding(text) {
        // Simple hash-based embedding for demonstration
        // In production, use proper embedding models
        let hash = this.hashString(text);
        const embedding = [];
        for (let i = 0; i < 384; i++) {
            embedding.push((hash % 1000) / 1000 - 0.5);
            hash = (hash * 1103515245 + 12345) % (2 ** 31);
        }
        return embedding;
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.model = await this.createModel();
        this.embeddingModel = await this.createEmbeddingModel();
    }
    getConfig() {
        return { ...this.config };
    }
}
