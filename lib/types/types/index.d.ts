export interface TableSchema {
    name: string;
    columns: ColumnSchema[];
    primaryKey?: string[];
    foreignKeys?: ForeignKeySchema[];
    indexes?: IndexSchema[];
}
export interface ColumnSchema {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: string;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
}
export interface ForeignKeySchema {
    column: string;
    referencedTable: string;
    referencedColumn: string;
}
export interface IndexSchema {
    name: string;
    columns: string[];
    unique: boolean;
}
export interface DatabaseSchema {
    tables: TableSchema[];
    version?: string;
    database?: string;
}
export interface QuestionSQLPair {
    id?: string;
    question: string;
    sql: string;
    embedding?: number[];
}
export interface DDLItem {
    id?: string;
    ddl: string;
    table_name?: string;
    embedding?: number[];
}
export interface DocumentationItem {
    id?: string;
    documentation: string;
    title?: string;
    embedding?: number[];
}
export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'cohere';
    model: string;
    apiKey?: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface SQLGenerationOptions {
    outputFormat?: 'sql' | 'drizzle';
    database?: 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
    includeExplanation?: boolean;
    allowLLMToSeeData?: boolean;
    maxTokens?: number;
    temperature?: number;
}
export interface SQLGenerationResponse {
    sql: string;
    drizzleQuery?: string;
    explanation?: string;
    confidence?: number;
    metadata?: {
        tablesUsed: string[];
        columnsUsed: string[];
        queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
        similarQuestions: QuestionSQLPair[];
        relatedDDL: DDLItem[];
        relatedDocs: DocumentationItem[];
    };
}
export interface TrainingPlanItem {
    type: 'ddl' | 'question-sql' | 'documentation';
    group?: string;
    name: string;
    value: string;
}
export interface TrainingPlan {
    items: TrainingPlanItem[];
}
export interface VectorStoreConfig {
    type: 'memory' | 'chromadb' | 'pinecone' | 'pgvector';
    config?: any;
    similarityThreshold?: number;
}
export interface PgVectorConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean;
    schema?: string;
    tableName?: string;
    vectorDimension?: number;
    embeddingDimension?: number;
    similarityThreshold?: number;
}
export interface SchemaExportOptions {
    format: 'json' | 'typescript' | 'drizzle';
    includeData?: boolean;
    includeIndexes?: boolean;
    includeForeignKeys?: boolean;
    camelCase?: boolean;
    importPath?: string;
}
export interface SystemMessage {
    role: 'system';
    content: string;
}
export interface UserMessage {
    role: 'user';
    content: string;
}
export interface AssistantMessage {
    role: 'assistant';
    content: string;
}
export type Message = SystemMessage | UserMessage | AssistantMessage;
export interface EmbeddingResponse {
    embedding: number[];
    usage?: {
        promptTokens: number;
        totalTokens: number;
    };
}
export interface SimilarityResult<T> {
    item: T;
    similarity: number;
}
export interface DatabaseConnection {
    type: 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
    runSQL: (sql: string) => Promise<any>;
}
export interface IzumiConfig {
    llm?: LLMConfig;
    vectorStore?: VectorStoreConfig;
    database?: DatabaseConnection;
    defaultDatabase?: 'postgresql' | 'mysql' | 'sqlite' | 'mssql';
    maxTokens?: number;
    dialect?: string;
    language?: string;
}
//# sourceMappingURL=index.d.ts.map