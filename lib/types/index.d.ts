export { Izumi } from './implementations/Izumi.js';
export { IzumiBase } from './base/IzumiBase.js';
export { VercelAIChat } from './llm/VercelAIChat.js';
export { MemoryVectorStore } from './vector/MemoryVectorStore.js';
export { PgVectorStore } from './vector/PgVectorStore.js';
export { SchemaParser } from './utils/SchemaParser.js';
export { SchemaExporter } from './utils/SchemaExporter.js';
export * from './types/index.js';
import { Izumi } from './implementations/Izumi.js';
import type { IzumiConfig, DatabaseConnection } from './types/index.js';
/**
 * Create an Izumi instance with OpenAI
 * Example: const izumi = createOpenAIIzumi('your-api-key');
 */
export declare function createOpenAIIzumi(apiKey: string, model?: string): Izumi;
/**
 * Create an Izumi instance with Anthropic
 * Example: const izumi = createAnthropicIzumi('your-api-key');
 */
export declare function createAnthropicIzumi(apiKey: string, model?: string): Izumi;
/**
 * Create an Izumi instance with Google
 * Example: const izumi = createGoogleIzumi('your-api-key');
 */
export declare function createGoogleIzumi(apiKey: string, model?: string): Izumi;
/**
 * Create an Izumi instance with Mistral
 * Example: const izumi = createMistralIzumi('your-api-key');
 */
export declare function createMistralIzumi(apiKey: string, model?: string): Izumi;
/**
 * Create an Izumi instance with Cohere
 * Example: const izumi = createCohereIzumi('your-api-key');
 */
export declare function createCohereIzumi(apiKey: string, model?: string): Izumi;
/**
 * Create an Izumi instance with custom configuration
 * Example: const izumi = createIzumi({ llm: { provider: 'openai', apiKey: '...' } });
 */
export declare function createIzumi(config: IzumiConfig): Izumi;
/**
 * Create an Izumi instance with OpenAI and auto-initialize with database
 * Example: const izumi = createOpenAIWithDatabase('your-api-key', dbConnection);
 */
export declare function createOpenAIWithDatabase(apiKey: string, dbConnection: DatabaseConnection, model?: string): Izumi;
/**
 * Create an Izumi instance with Anthropic and auto-initialize with database
 * Example: const izumi = createAnthropicWithDatabase('your-api-key', dbConnection);
 */
export declare function createAnthropicWithDatabase(apiKey: string, dbConnection: DatabaseConnection, model?: string): Izumi;
export default Izumi;
//# sourceMappingURL=index.d.ts.map