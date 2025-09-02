import { IzumiBase } from '../base/IzumiBase.js';
import { VercelAIChat } from '../llm/VercelAIChat.js';
import { MemoryVectorStore } from '../vector/MemoryVectorStore.js';
import { PgVectorStore } from '../vector/PgVectorStore.js';
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
  DatabaseConnection,
} from '../types/index.js';

/**
 * Main Izumi implementation combining LLM and vector store
 * Following the  pattern with Drizzle ORM support
 */
export class Izumi extends IzumiBase {
  private llm: VercelAIChat;
  private vectorStore: MemoryVectorStore | PgVectorStore;
  private schema?: DatabaseSchema;

  constructor(config: IzumiConfig = {}) {
    super(config);
    
    // Initialize LLM
    const llmConfig: LLMConfig = config.llm || {
      provider: 'openai',
      model: 'gpt-4o-mini',
    };
    this.llm = new VercelAIChat(llmConfig);
    
    // Initialize vector store based on config
    if (config.vectorStore?.type === 'pgvector') {
      // Import PgVectorStore dynamically to avoid requiring pg dependency
      try {
        this.vectorStore = new PgVectorStore(config.vectorStore);
      } catch (error) {
        console.warn('PgVectorStore initialization failed, falling back to MemoryVectorStore:', error);
        this.vectorStore = new MemoryVectorStore();
      }
    } else {
      this.vectorStore = new MemoryVectorStore();
    }

    // Auto-initialize if database config is provided
    if (config.database) {
      // Start auto-initialization asynchronously after model is ready
      this.startAutoInitialization(config.database);
    }
  }

  /**
   * Start auto-initialization asynchronously after ensuring model is ready
   */
  private async startAutoInitialization(dbConfig: DatabaseConnection): Promise<void> {
    try {
      // Wait for LLM model to be fully initialized
      await this.llm.waitForInitialization();
      
      // Now proceed with auto-initialization
      await this.autoInitializeWithDatabase(dbConfig);
    } catch (error) {
      console.error('Auto-initialization failed:', error);
    }
  }

  /**
   * Auto-initialize with database connection and generate training data
   */
  private async autoInitializeWithDatabase(dbConfig: DatabaseConnection): Promise<void> {
    try {
      console.log('🔄 Auto-initializing Izumi with database...');
      
      // Extract schema from database
      const schemaDDL = await this.extractSchemaFromDatabase(dbConfig);
      
      if (schemaDDL) {
        // Load schema
        await this.loadSchemaFromDDL(schemaDDL);
        
        // Generate training data automatically
        console.log('🤖 Generating training data from schema...');
        const result = await this.generateTrainingDataFromSchema({
          numQuestions: 20,
          includeBasicQueries: true,
          includeAdvancedQueries: true,
          includeAnalyticsQueries: true
        });
        
        console.log(`✅ Auto-initialization complete! Generated ${result.generated} training examples.`);
        console.log('💡 You can now ask questions about your database!');
      } else {
        console.warn('⚠️ Could not extract schema from database. You may need to train manually.');
      }
    } catch (error) {
      console.error('❌ Auto-initialization failed:', error);
      console.log('💡 You can still use Izumi by training manually with DDL statements.');
    }
  }

  /**
   * Extract schema DDL from database connection
   */
  private async extractSchemaFromDatabase(dbConfig: DatabaseConnection): Promise<string | null> {
    if (!dbConfig.runSQL) {
      return null;
    }

    try {
      let schemaQuery = '';
      
      switch (dbConfig.type) {
        case 'postgresql':
          schemaQuery = `
            SELECT 
              'CREATE TABLE ' || table_name || ' (' ||
              string_agg(
                column_name || ' ' || data_type || 
                CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
                ', '
              ) || ');' as ddl
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            GROUP BY table_name
            ORDER BY table_name;
          `;
          break;
          
        case 'mysql':
          schemaQuery = `
            SELECT 
              CONCAT('CREATE TABLE ', table_name, ' (', 
                GROUP_CONCAT(
                  CONCAT(column_name, ' ', column_type, 
                    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END)
                  SEPARATOR ', '
                ), ');') as ddl
            FROM information_schema.columns 
            WHERE table_schema = DATABASE()
            GROUP BY table_name
            ORDER BY table_name;
          `;
          break;
          
        case 'sqlite':
          schemaQuery = `
            SELECT sql as ddl 
            FROM sqlite_master 
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name;
          `;
          break;
          
        default:
          console.warn(`Schema extraction not supported for ${dbConfig.type}`);
          return null;
      }

      const result = await dbConfig.runSQL(schemaQuery);
      
      if (Array.isArray(result) && result.length > 0) {
        // Combine all DDL statements
        return result.map((row: any) => row.ddl || row.sql).filter(Boolean).join('\n\n');
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting schema:', error);
      return null;
    }
  }

  // Implement abstract methods from IzumiBase

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    return this.llm.generateEmbedding(text);
  }

  async getSimilarQuestionSQL(question: string): Promise<QuestionSQLPair[]> {
    const embedding = await this.generateEmbedding(question);
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.getSimilarQuestionSQL(embedding.embedding);
    } else {
      // For PgVectorStore, we need to implement similarity search
      // This is a simplified implementation - in production you'd want proper similarity search
      const trainingData = await this.getTrainingData();
      return trainingData.questionSQL.slice(0, 5);
    }
  }

  async getRelatedDDL(question: string): Promise<DDLItem[]> {
    const embedding = await this.generateEmbedding(question);
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.getRelatedDDL(embedding.embedding);
    } else {
      // For PgVectorStore, simplified implementation
      const trainingData = await this.getTrainingData();
      return trainingData.ddl.slice(0, 10);
    }
  }

  async getRelatedDocumentation(question: string): Promise<DocumentationItem[]> {
    const embedding = await this.generateEmbedding(question);
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.getRelatedDocumentation(embedding.embedding);
    } else {
      // For PgVectorStore, simplified implementation
      const trainingData = await this.getTrainingData();
      return trainingData.documentation.slice(0, 5);
    }
  }

  async addQuestionSQL(question: string, sql: string): Promise<string> {
    const embedding = await this.generateEmbedding(`${question} ${sql}`);
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.addQuestionSQL(question, sql, embedding.embedding);
    } else {
      // For PgVectorStore
      await (this.vectorStore as any).storeQuestionSQL({
        question,
        sql,
        embedding: embedding.embedding
      });
      return `question-sql-${Date.now()}`;
    }
  }

  async addDDL(ddl: string): Promise<string> {
    const embedding = await this.generateEmbedding(ddl);
    const tableName = this.extractTableNameFromDDL(ddl);
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.addDDL(ddl, embedding.embedding, tableName);
    } else {
      // For PgVectorStore
      await (this.vectorStore as any).storeDDL({
        ddl,
        table_name: tableName,
        embedding: embedding.embedding
      });
      return `ddl-${Date.now()}`;
    }
  }

  async addDocumentation(documentation: string, title?: string): Promise<string> {
    const embedding = await this.generateEmbedding(documentation);
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.addDocumentation(documentation, embedding.embedding, title);
    } else {
      // For PgVectorStore
      await (this.vectorStore as any).storeDocumentation({
        documentation,
        title,
        embedding: embedding.embedding
      });
      return `doc-${Date.now()}`;
    }
  }

  async removeTrainingData(id: string): Promise<boolean> {
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.removeTrainingData(id);
    } else {
      // PgVectorStore doesn't have removeTrainingData method yet
      console.warn('removeTrainingData not implemented for PgVectorStore');
      return false;
    }
  }

  async getTrainingData(): Promise<{
    questionSQL: QuestionSQLPair[];
    ddl: DDLItem[];
    documentation: DocumentationItem[];
  }> {
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.getTrainingData();
    } else {
      // For PgVectorStore, return empty data for now
      // In production, you'd implement proper retrieval methods
      return {
        questionSQL: [],
        ddl: [],
        documentation: []
      };
    }
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
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.getStatistics();
    } else {
      // For PgVectorStore, get summary if available
      if ('getTrainingSummary' in this.vectorStore) {
        const summary = await (this.vectorStore as any).getTrainingSummary();
        return {
          questionSQLCount: summary.questionSQLCount || 0,
          ddlCount: summary.ddlCount || 0,
          documentationCount: summary.documentationCount || 0,
          totalItems: summary.totalItems || 0
        };
      }
      return {
        questionSQLCount: 0,
        ddlCount: 0,
        documentationCount: 0,
        totalItems: 0
      };
    }
  }

  /**
   * Clear all training data
   */
  async clearTrainingData(): Promise<void> {
    if (this.vectorStore instanceof MemoryVectorStore) {
      this.vectorStore.clear();
    } else if ('clear' in this.vectorStore) {
      await (this.vectorStore as any).clear();
    }
  }

  /**
   * Export training data
   */
  exportTrainingData(): string {
    if (this.vectorStore instanceof MemoryVectorStore) {
      return this.vectorStore.export();
    } else {
      // PgVectorStore doesn't support export yet
      console.warn('Export not implemented for PgVectorStore');
      return '{}';
    }
  }

  /**
   * Import training data
   */
  importTrainingData(jsonData: string): void {
    if (this.vectorStore instanceof MemoryVectorStore) {
      this.vectorStore.import(jsonData);
    } else {
      // PgVectorStore doesn't support import yet
      console.warn('Import not implemented for PgVectorStore');
    }
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

  /**
   * Initialize the vector store (for pgvector)
   */
  async initialize(): Promise<void> {
    // Only PgVectorStore has initialize method
    if (this.vectorStore && 'initialize' in this.vectorStore && typeof this.vectorStore.initialize === 'function') {
      await (this.vectorStore as any).initialize();
    }
  }

  // Private helper methods

  private extractTableNameFromDDL(ddl: string): string | undefined {
    const match = ddl.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
    return match ? match[1] : undefined;
  }
}
