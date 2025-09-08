import { QuestionSQLPair, DDLItem, DocumentationItem, SimilarityResult, PgVectorConfig } from '../types/index.js';
/**
 * PostgreSQL pgvector-based vector store for storing and retrieving embeddings
 */
export declare class PgVectorStore {
    private pool;
    private config;
    private embeddingDimension;
    private schema;
    private initialized;
    constructor(config: PgVectorConfig);
    /**
     * Initialize the PostgreSQL connection pool
     * Must be called before using other methods
     */
    connect(): Promise<void>;
    /**
     * Ensure connection is established before using pool
     */
    private ensureConnected;
    /**
     * Initialize the vector store by creating necessary tables and extensions
     */
    initialize(): Promise<void>;
    private createTables;
    /**
     * Store a question-SQL pair with its embedding
     */
    storeQuestionSQL(item: QuestionSQLPair): Promise<void>;
    /**
     * Store DDL with its embedding
     */
    storeDDL(item: DDLItem): Promise<void>;
    /**
     * Store documentation with its embedding
     */
    storeDocumentation(item: DocumentationItem): Promise<void>;
    /**
     * Find similar question-SQL pairs
     */
    findSimilarQuestions(embedding: number[], limit?: number): Promise<SimilarityResult<QuestionSQLPair>[]>;
    /**
     * Find similar DDL items
     */
    findSimilarDDL(embedding: number[], limit?: number): Promise<SimilarityResult<DDLItem>[]>;
    /**
     * Find similar documentation
     */
    findSimilarDocumentation(embedding: number[], limit?: number): Promise<SimilarityResult<DocumentationItem>[]>;
    /**
     * Get summary of stored training data
     */
    getTrainingSummary(): Promise<{
        questionSQLPairs: number;
        ddlItems: number;
        documentationItems: number;
    }>;
    /**
     * Clear all training data
     */
    clear(): Promise<void>;
    /**
     * Close the database connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=PgVectorStore.d.ts.map