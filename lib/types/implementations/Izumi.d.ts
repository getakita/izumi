import { IzumiBase } from '../base/IzumiBase.js';
import { IzumiConfig, LLMConfig, QuestionSQLPair, DDLItem, DocumentationItem, Message, EmbeddingResponse, DatabaseSchema, SchemaExportOptions } from '../types/index.js';
/**
 * Main Izumi implementation combining LLM and vector store
 * Following the  pattern with Drizzle ORM support
 */
export declare class Izumi extends IzumiBase {
    private llm;
    private vectorStore;
    private schema?;
    constructor(config?: IzumiConfig);
    /**
     * Start auto-initialization asynchronously after ensuring model is ready
     */
    private startAutoInitialization;
    /**
     * Auto-initialize with database connection and generate training data
     */
    private autoInitializeWithDatabase;
    /**
     * Extract schema DDL from database connection
     */
    private extractSchemaFromDatabase;
    generateEmbedding(text: string): Promise<EmbeddingResponse>;
    getSimilarQuestionSQL(question: string): Promise<QuestionSQLPair[]>;
    getRelatedDDL(question: string): Promise<DDLItem[]>;
    getRelatedDocumentation(question: string): Promise<DocumentationItem[]>;
    addQuestionSQL(question: string, sql: string): Promise<string>;
    addDDL(ddl: string): Promise<string>;
    addDocumentation(documentation: string, title?: string): Promise<string>;
    removeTrainingData(id: string): Promise<boolean>;
    getTrainingData(): Promise<{
        questionSQL: QuestionSQLPair[];
        ddl: DDLItem[];
        documentation: DocumentationItem[];
    }>;
    submitPrompt(prompt: Message[]): Promise<string>;
    /**
     * Set the database schema
     */
    setSchema(schema: DatabaseSchema): void;
    /**
     * Get the current schema
     */
    getSchema(): DatabaseSchema | undefined;
    /**
     * Load schema from DDL string
     */
    loadSchemaFromDDL(ddlContent: string): Promise<void>;
    /**
     * Load schema from Drizzle schema object
     */
    loadSchemaFromDrizzle(drizzleSchema: Record<string, any>): Promise<void>;
    /**
     * Add a table from DDL
     */
    addTable(ddl: string): Promise<void>;
    /**
     * Export schema in various formats
     */
    exportSchema(options: SchemaExportOptions): string;
    /**
     * Connect to PostgreSQL database
     */
    connectToPostgreSQL(config: {
        host: string;
        database: string;
        user: string;
        password: string;
        port?: number;
    }): void;
    /**
     * Connect to SQLite database
     */
    connectToSQLite(path: string): void;
    /**
     * Get training statistics
     */
    getTrainingStatistics(): Promise<{
        questionSQLCount: number;
        ddlCount: number;
        documentationCount: number;
        totalItems: number;
    }>;
    /**
     * Clear all training data
     */
    clearTrainingData(): Promise<void>;
    /**
     * Export training data
     */
    exportTrainingData(): string;
    /**
     * Import training data
     */
    importTrainingData(jsonData: string): void;
    /**
     * Update LLM configuration
     */
    updateLLMConfig(config: Partial<LLMConfig>): void;
    /**
     * Get LLM configuration
     */
    getLLMConfig(): LLMConfig;
    /**
     * Generate follow-up questions
     */
    generateFollowupQuestions(question: string, sql: string, results?: any, count?: number): Promise<string[]>;
    /**
     * Explain SQL query
     */
    explainSQL(sql: string): Promise<string>;
    /**
     * Validate SQL syntax
     */
    validateSQL(sql: string): boolean;
    /**
     * Initialize the vector store (for pgvector)
     */
    initialize(): Promise<void>;
    private extractTableNameFromDDL;
}
//# sourceMappingURL=Izumi.d.ts.map