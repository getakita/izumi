import { QuestionSQLPair, DDLItem, DocumentationItem } from '../types/index.js';
/**
 * Simple in-memory vector store for storing and retrieving training data
 * Uses cosine similarity for finding related items
 */
export declare class MemoryVectorStore {
    private questionSQLPairs;
    private ddlItems;
    private documentationItems;
    addQuestionSQL(question: string, sql: string, embedding: number[]): Promise<string>;
    addDDL(ddl: string, embedding: number[], tableName?: string): Promise<string>;
    addDocumentation(documentation: string, embedding: number[], title?: string): Promise<string>;
    getSimilarQuestionSQL(queryEmbedding: number[], limit?: number): Promise<QuestionSQLPair[]>;
    getRelatedDDL(queryEmbedding: number[], limit?: number): Promise<DDLItem[]>;
    getRelatedDocumentation(queryEmbedding: number[], limit?: number): Promise<DocumentationItem[]>;
    removeTrainingData(id: string): Promise<boolean>;
    getTrainingData(): Promise<{
        questionSQL: QuestionSQLPair[];
        ddl: DDLItem[];
        documentation: DocumentationItem[];
    }>;
    findDDLByTableName(tableName: string): Promise<DDLItem[]>;
    searchQuestionSQL(query: string): Promise<QuestionSQLPair[]>;
    getStatistics(): Promise<{
        questionSQLCount: number;
        ddlCount: number;
        documentationCount: number;
        totalItems: number;
    }>;
    clear(): void;
    private cosineSimilarity;
    private generateId;
    export(): string;
    import(jsonData: string): void;
}
//# sourceMappingURL=MemoryVectorStore.d.ts.map