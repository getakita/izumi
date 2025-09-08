import { QuestionSQLPair, DDLItem, DocumentationItem, SQLGenerationOptions, SQLGenerationResponse, TrainingPlan, Message, SystemMessage, UserMessage, AssistantMessage, EmbeddingResponse, IzumiConfig } from '../types/index.js';
/**
 * Abstract base class for Izumi following the  pattern
 *
 * This class provides the core functionality for text-to-SQL conversion
 * and must be extended with concrete implementations for LLM and vector store
 */
export declare abstract class IzumiBase {
    protected config: IzumiConfig;
    protected runSQL?: (sql: string) => Promise<any>;
    protected runSQLIsSet: boolean;
    protected dialect: string;
    protected language?: string;
    protected maxTokens: number;
    constructor(config?: IzumiConfig);
    /**
     * Main method for asking questions and getting SQL + results
     * Following Vanna's ask() pattern
     */
    ask(question: string, options?: {
        printResults?: boolean;
        autoTrain?: boolean;
        visualize?: boolean;
        allowLLMToSeeData?: boolean;
    }): Promise<{
        sql: string | null;
        results: any | null;
        explanation?: string;
    }>;
    /**
     * Train the model with various types of data
     * Following Vanna's train() pattern
     */
    train(params: {
        question?: string;
        sql?: string;
        ddl?: string;
        documentation?: string;
        plan?: TrainingPlan;
    }): Promise<string>;
    /**
     * Core SQL generation method
     * Following Vanna's generate_sql() pattern
     */
    generateSQL(question: string, options?: SQLGenerationOptions): Promise<SQLGenerationResponse>;
    /**
     * Extract SQL from LLM response
     * Following Vanna's extract_sql() pattern
     */
    extractSQL(llmResponse: string): string;
    /**
     * Convert SQL to Drizzle ORM syntax
     */
    sqlToDrizzle(sql: string): Promise<string>;
    /**
     * Generate a question from SQL
     */
    generateQuestion(sql: string): Promise<string>;
    /**
     * Automatically generate training data from database schema
     * Uses LLM to analyze schema and create relevant question-SQL pairs
     */
    generateTrainingDataFromSchema(options?: {
        numQuestions?: number;
        includeBasicQueries?: boolean;
        includeAdvancedQueries?: boolean;
        includeAnalyticsQueries?: boolean;
        customPrompt?: string;
    }): Promise<{
        generated: number;
        questions: QuestionSQLPair[];
    }>;
    /**
     * Get schema information from training data
     */
    private getSchemaInfo;
    /**
     * Build prompt for schema analysis
     */
    private buildSchemaAnalysisPrompt;
    /**
     * Parse generated questions from LLM response
     */
    private parseGeneratedQuestions;
    /**
     * Generate embeddings for text
     */
    abstract generateEmbedding(text: string): Promise<EmbeddingResponse>;
    /**
     * Get similar question-SQL pairs
     */
    abstract getSimilarQuestionSQL(question: string): Promise<QuestionSQLPair[]>;
    /**
     * Get related DDL statements
     */
    abstract getRelatedDDL(question: string): Promise<DDLItem[]>;
    /**
     * Get related documentation
     */
    abstract getRelatedDocumentation(question: string): Promise<DocumentationItem[]>;
    /**
     * Add a question-SQL pair to the knowledge base
     */
    abstract addQuestionSQL(question: string, sql: string): Promise<string>;
    /**
     * Add DDL to the knowledge base
     */
    abstract addDDL(ddl: string): Promise<string>;
    /**
     * Add documentation to the knowledge base
     */
    abstract addDocumentation(documentation: string): Promise<string>;
    /**
     * Remove training data
     */
    abstract removeTrainingData(id: string): Promise<boolean>;
    /**
     * Get all training data
     */
    abstract getTrainingData(): Promise<{
        questionSQL: QuestionSQLPair[];
        ddl: DDLItem[];
        documentation: DocumentationItem[];
    }>;
    /**
     * Submit prompt to LLM
     */
    abstract submitPrompt(prompt: Message[]): Promise<string>;
    systemMessage(content: string): SystemMessage;
    userMessage(content: string): UserMessage;
    assistantMessage(content: string): AssistantMessage;
    protected getSQLPrompt(params: {
        question: string;
        questionSQLList: QuestionSQLPair[];
        ddlList: DDLItem[];
        docList: DocumentationItem[];
        options: SQLGenerationOptions;
    }): Message[];
    protected extractCode(response: string, language: string): string;
    protected extractExplanation(response: string): string | undefined;
    protected extractTablesUsed(sql: string): string[];
    protected extractColumnsUsed(sql: string): string[];
    protected extractQueryType(sql: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    log(message: string, title?: string): void;
    protected responseLanguage(): string;
}
//# sourceMappingURL=IzumiBase.d.ts.map