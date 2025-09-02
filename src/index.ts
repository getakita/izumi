// Main Izumi class (following Vanna.AI pattern)
export { Izumi } from './implementations/Izumi.js';
export { IzumiBase } from './base/IzumiBase.js';

// Core components
export { VercelAIChat } from './llm/VercelAIChat.js';
export { MemoryVectorStore } from './vector/MemoryVectorStore.js';
export { PgVectorStore } from './vector/PgVectorStore.js';

// Utilities
export { SchemaParser } from './utils/SchemaParser.js';
export { SchemaExporter } from './utils/SchemaExporter.js';

// Types
export * from './types/index.js';

// Import the main class and types for factory functions
import { Izumi } from './implementations/Izumi.js';
import type { IzumiConfig } from './types/index.js';

// Factory functions (following Vanna pattern)

/**
 * Create an Izumi instance with OpenAI
 * Example: const izumi = createOpenAIIzumi('your-api-key');
 */
export function createOpenAIIzumi(apiKey: string, model: string = 'gpt-4o-mini') {
  return new Izumi({
    llm: {
      provider: 'openai',
      model,
      apiKey,
    },
  });
}

/**
 * Create an Izumi instance with Anthropic
 * Example: const izumi = createAnthropicIzumi('your-api-key');
 */
export function createAnthropicIzumi(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
  return new Izumi({
    llm: {
      provider: 'anthropic',
      model,
      apiKey,
    },
  });
}

/**
 * Create an Izumi instance with Google
 * Example: const izumi = createGoogleIzumi('your-api-key');
 */
export function createGoogleIzumi(apiKey: string, model: string = 'gemini-1.5-pro') {
  return new Izumi({
    llm: {
      provider: 'google',
      model,
      apiKey,
    },
  });
}

/**
 * Create an Izumi instance with Mistral
 * Example: const izumi = createMistralIzumi('your-api-key');
 */
export function createMistralIzumi(apiKey: string, model: string = 'mistral-large-latest') {
  return new Izumi({
    llm: {
      provider: 'mistral',
      model,
      apiKey,
    },
  });
}

/**
 * Create an Izumi instance with Cohere
 * Example: const izumi = createCohereIzumi('your-api-key');
 */
export function createCohereIzumi(apiKey: string, model: string = 'cohere') {
  return new Izumi({
    llm: {
      provider: 'cohere',
      model,
      apiKey,
    },
  });
}

/**
 * Create an Izumi instance with custom configuration
 * Example: const izumi = createIzumi({ llm: { provider: 'openai', apiKey: '...' } });
 */
export function createIzumi(config: IzumiConfig) {
  return new Izumi(config);
}

/**
 * Create an Izumi instance with OpenAI and PostgreSQL pgvector
 * Example: const izumi = createOpenAIWithPgVector('your-openai-key', pgConfig);
 */
export function createOpenAIWithPgVector(
  apiKey: string, 
  pgConfig: import('./types/index.js').PgVectorConfig,
  model: string = 'gpt-4o-mini'
) {
  return new Izumi({
    llm: {
      provider: 'openai',
      model,
      apiKey,
    },
    vectorStore: {
      type: 'pgvector',
      config: pgConfig,
    },
  });
}

// Default export for convenience
export default Izumi;