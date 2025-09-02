import { IzumiBase } from '../base/IzumiBase.js';
import { VercelAIChat } from '../llm/VercelAIChat.js';
import { MemoryVectorStore } from '../vector/MemoryVectorStore.js';
import { SchemaParser } from '../utils/SchemaParser.js';
import { SchemaExporter } from '../utils/SchemaExporter.js';
import {
  IzumiConfig,
  LLMConfig,
  QuestionSQLPair,
  DDLItem,
  DocumentationItem,
  Message,
  EmbeddingResponse,
  DatabaseSchema,
  SchemaExportOptions,
} from '../types/index.js';

/**
 * Main Izumi implementation combining LLM and vector store
 * Following the Vanna.AI pattern with Drizzle ORM support
 */
export class Izumi extends IzumiBase {
  private llm: VercelAIChat;
  private vectorStore: MemoryVectorStore;
  private schema?: DatabaseSchema;

  constructor(config: IzumiConfig = {}) {
    super(config);
    
    // Initialize LLM
    const llmConfig: LLMConfig = config.llm || {
      provider: 'openai',
      model: 'gpt-4o-mini',
    };
    this.llm = new VercelAIChat(llmConfig);
    
    // Initialize vector store
    this.vectorStore = new MemoryVectorStore();
  }

  // Implement abstract methods from IzumiBase

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    return this.llm.generateEmbedding(text);
  }

  async getSimilarQuestionSQL(question: string): Promise<QuestionSQLPair[]> {
    const embedding = await this.generateEmbedding(question);
    return this.vectorStore.getSimilarQuestionSQL(embedding.embedding);
  }

  async getRelatedDDL(question: string): Promise<DDLItem[]> {
    const embedding = await this.generateEmbedding(question);
    return this.vectorStore.getRelatedDDL(embedding.embedding);
  }

  async getRelatedDocumentation(question: string): Promise<DocumentationItem[]> {
    const embedding = await this.generateEmbedding(question);
    return this.vectorStore.getRelatedDocumentation(embedding.embedding);
  }

  async addQuestionSQL(question: string, sql: string): Promise<string> {
    const embedding = await this.generateEmbedding(`${question} ${sql}`);
    return this.vectorStore.addQuestionSQL(question, sql, embedding.embedding);
  }

  async addDDL(ddl: string): Promise<string> {
    const embedding = await this.generateEmbedding(ddl);
    const tableName = this.extractTableNameFromDDL(ddl);
    return this.vectorStore.addDDL(ddl, embedding.embedding, tableName);
  }

  async addDocumentation(documentation: string, title?: string): Promise<string> {
    const embedding = await this.generateEmbedding(documentation);
    return this.vectorStore.addDocumentation(documentation, embedding.embedding, title);
  }

  async removeTrainingData(id: string): Promise<boolean> {
    return this.vectorStore.removeTrainingData(id);
  }

  async getTrainingData(): Promise<{
    questionSQL: QuestionSQLPair[];
    ddl: DDLItem[];
    documentation: DocumentationItem[];
  }> {
    return this.vectorStore.getTrainingData();
  }

  async submitPrompt(prompt: Message[]): Promise<string> {
    return this.llm.submitPrompt(prompt);
  }

  // Schema management methods

  /**
   * Set the database schema
   */
  setSchema(schema: DatabaseSchema): void {
    this.schema = schema;
  }

  /**
   * Get the current schema
   */
  getSchema(): DatabaseSchema | undefined {
    return this.schema;
  }

  /**
   * Load schema from DDL string
   */
  async loadSchemaFromDDL(ddlContent: string): Promise<void> {
    this.schema = SchemaParser.parseDDL(ddlContent);
    
    // Automatically add DDL to training data
    await this.addDDL(ddlContent);
    
    // Add schema documentation
    const schemaDoc = SchemaParser.schemaToContext(this.schema);
    await this.addDocumentation(schemaDoc, 'Database Schema');
  }

  /**
   * Load schema from Drizzle schema object
   */
  async loadSchemaFromDrizzle(drizzleSchema: Record<string, any>): Promise<void> {
    this.schema = SchemaParser.parseDrizzleSchema(drizzleSchema);
    
    // Add schema documentation
    const schemaDoc = SchemaParser.schemaToContext(this.schema);
    await this.addDocumentation(schemaDoc, 'Drizzle Schema');
  }

  /**
   * Add a table from DDL
   */
  async addTable(ddl: string): Promise<void> {
    await this.addDDL(ddl);
    
    // Update schema if we have one
    if (this.schema) {
      const newSchema = SchemaParser.parseDDL(ddl);
      this.schema.tables.push(...newSchema.tables);
    }
  }

  /**
   * Export schema in various formats
   */
  exportSchema(options: SchemaExportOptions): string {
    if (!this.schema) {
      throw new Error('No schema loaded. Load a schema first.');
    }

    switch (options.format) {
      case 'json':
        return SchemaExporter.exportToJSON(this.schema, options);
      case 'typescript':
        return SchemaExporter.exportToTypeScript(this.schema, options);
      case 'drizzle':
        return SchemaExporter.exportToDrizzle(this.schema, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  // Database connection methods (following Vanna pattern)

  /**
   * Connect to PostgreSQL database
   */
  connectToPostgreSQL(config: {
    host: string;
    database: string;
    user: string;
    password: string;
    port?: number;
  }): void {
    // This would require pg package
    // For now, just set the dialect
    this.dialect = 'PostgreSQL';
    console.log('PostgreSQL connection configured (requires pg package)');
  }

  /**
   * Connect to SQLite database
   */
  connectToSQLite(path: string): void {
    // This would require sqlite3 or better-sqlite3
    this.dialect = 'SQLite';
    console.log('SQLite connection configured (requires sqlite3 package)');
  }

  // Utility methods

  /**
   * Get training statistics
   */
  async getTrainingStatistics(): Promise<{
    questionSQLCount: number;
    ddlCount: number;
    documentationCount: number;
    totalItems: number;
  }> {
    return this.vectorStore.getStatistics();
  }

  /**
   * Clear all training data
   */
  clearTrainingData(): void {
    this.vectorStore.clear();
  }

  /**
   * Export training data
   */
  exportTrainingData(): string {
    return this.vectorStore.export();
  }

  /**
   * Import training data
   */
  importTrainingData(jsonData: string): void {
    this.vectorStore.import(jsonData);
  }

  /**
   * Update LLM configuration
   */
  updateLLMConfig(config: Partial<LLMConfig>): void {
    this.llm.updateConfig(config);
  }

  /**
   * Get LLM configuration
   */
  getLLMConfig(): LLMConfig {
    return this.llm.getConfig();
  }

  /**
   * Generate follow-up questions
   */
  async generateFollowupQuestions(
    question: string, 
    sql: string, 
    results?: any, 
    count: number = 5
  ): Promise<string[]> {
    const prompt = [
      this.systemMessage(`Generate ${count} follow-up questions based on the original question and SQL results. Return one question per line.`),
      this.userMessage(`Original question: ${question}\nSQL: ${sql}\nResults: ${results ? JSON.stringify(results).substring(0, 500) : 'No results'}`),
    ];

    const response = await this.submitPrompt(prompt);
    return response.split('\n').filter(line => line.trim()).slice(0, count);
  }

  /**
   * Explain SQL query
   */
  async explainSQL(sql: string): Promise<string> {
    const prompt = [
      this.systemMessage('Explain the following SQL query in simple terms. Describe what it does and how it works.'),
      this.userMessage(sql),
    ];

    return this.submitPrompt(prompt);
  }

  /**
   * Validate SQL syntax
   */
  validateSQL(sql: string): boolean {
    // Simple validation - in production, use a proper SQL parser
    const trimmed = sql.trim().toLowerCase();
    const validStarts = ['select', 'insert', 'update', 'delete', 'with'];
    return validStarts.some(start => trimmed.startsWith(start));
  }

  // Private helper methods

  private extractTableNameFromDDL(ddl: string): string | undefined {
    const match = ddl.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
    return match ? match[1] : undefined;
  }
}
