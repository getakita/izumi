import {
  QuestionSQLPair,
  DDLItem,
  DocumentationItem,
  SimilarityResult,
  VectorStoreConfig,
  PgVectorConfig
} from '../types/index.js';

// Optional pg import - only used if pgvector is available
let Pool: any;

// Function to dynamically load pg module
async function loadPgModule() {
  if (Pool) return { Pool };
  
  try {
    // Try ES module import first
    const pg = await import('pg');
    Pool = pg.default?.Pool || pg.Pool;
    return { Pool };
  } catch (error: any) {
    console.warn('pg module not found. PgVectorStore will not be available.');
    throw new Error(`PostgreSQL module not available: ${error.message}`);
  }
}

/**
 * PostgreSQL pgvector-based vector store for storing and retrieving embeddings
 */
export class PgVectorStore {
  private pool: any;
  private config: PgVectorConfig;
  private embeddingDimension: number;
  private schema: string;
  private initialized: boolean = false;

  constructor(config: PgVectorConfig) {
    this.config = config;
    this.embeddingDimension = config.embeddingDimension || 384;
    this.schema = config.schema || 'izumi';
  }

  /**
   * Initialize the PostgreSQL connection pool
   * Must be called before using other methods
   */
  async connect(): Promise<void> {
    if (this.initialized) return;

    try {
      const { Pool: PgPool } = await loadPgModule();
      
      // Create PostgreSQL pool
      if (this.config.connectionString) {
        this.pool = new PgPool({
          connectionString: this.config.connectionString,
        });
      } else {
        this.pool = new PgPool({
          host: this.config.host || 'localhost',
          port: this.config.port || 5432,
          database: this.config.database || 'izumi',
          user: this.config.user || 'postgres',
          password: this.config.password,
          ssl: this.config.ssl || false,
        });
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize PgVectorStore: ${error}`);
    }
  }

  /**
   * Ensure connection is established before using pool
   */
  private async ensureConnected(): Promise<void> {
    if (!this.initialized) {
      await this.connect();
    }
  }

  /**
   * Initialize the vector store by creating necessary tables and extensions
   */
  async initialize(): Promise<void> {
    // First ensure we're connected
    await this.ensureConnected();
    
    const client = await this.pool.connect();
    
    try {
      // Create pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      
      // Create schema if it doesn't exist
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.schema};`);
      
      // Create tables for different types of training data
      await this.createTables(client);
      
      console.log('PgVectorStore initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize PgVectorStore: ${error}`);
    } finally {
      client.release();
    }
  }

  private async createTables(client: any): Promise<void> {
    // Question-SQL pairs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${this.schema}.question_sql_pairs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        sql TEXT NOT NULL,
        embedding vector(${this.embeddingDimension}),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // DDL items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${this.schema}.ddl_items (
        id SERIAL PRIMARY KEY,
        ddl TEXT NOT NULL,
        table_name TEXT,
        embedding vector(${this.embeddingDimension}),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Documentation items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${this.schema}.documentation_items (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        title TEXT,
        embedding vector(${this.embeddingDimension}),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS question_sql_pairs_embedding_idx 
      ON ${this.schema}.question_sql_pairs 
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS ddl_items_embedding_idx 
      ON ${this.schema}.ddl_items 
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS documentation_items_embedding_idx 
      ON ${this.schema}.documentation_items 
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
  }

  /**
   * Store a question-SQL pair with its embedding
   */
  async storeQuestionSQL(item: QuestionSQLPair): Promise<void> {
    await this.ensureConnected();
    
    if (!item.embedding) {
      throw new Error('Embedding is required for storage');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query(
        `INSERT INTO ${this.schema}.question_sql_pairs (question, sql, embedding) 
         VALUES ($1, $2, $3::vector)
         ON CONFLICT DO NOTHING`,
        [item.question, item.sql, `[${item.embedding.join(',')}]`]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Store DDL with its embedding
   */
  async storeDDL(item: DDLItem): Promise<void> {
    if (!item.embedding) {
      throw new Error('Embedding is required for storage');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query(
        `INSERT INTO ${this.schema}.ddl_items (ddl, table_name, embedding) 
         VALUES ($1, $2, $3::vector)
         ON CONFLICT DO NOTHING`,
        [item.ddl, item.table_name || null, `[${item.embedding.join(',')}]`]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Store documentation with its embedding
   */
  async storeDocumentation(item: DocumentationItem): Promise<void> {
    if (!item.embedding) {
      throw new Error('Embedding is required for storage');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query(
        `INSERT INTO ${this.schema}.documentation_items (content, title, embedding) 
         VALUES ($1, $2, $3::vector)
         ON CONFLICT DO NOTHING`,
        [item.documentation, item.title || null, `[${item.embedding.join(',')}]`]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Find similar question-SQL pairs
   */
  async findSimilarQuestions(
    embedding: number[], 
    limit: number = 5
  ): Promise<SimilarityResult<QuestionSQLPair>[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT question, sql, (1 - (embedding <=> $1::vector)) as similarity
         FROM ${this.schema}.question_sql_pairs
         WHERE (1 - (embedding <=> $1::vector)) > $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [
          `[${embedding.join(',')}]`,
          this.config.similarityThreshold || 0.7,
          limit
        ]
      );

      return result.rows.map((row: any) => ({
        item: {
          question: row.question,
          sql: row.sql,
        },
        similarity: row.similarity,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find similar DDL items
   */
  async findSimilarDDL(
    embedding: number[], 
    limit: number = 5
  ): Promise<SimilarityResult<DDLItem>[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT ddl, table_name, (1 - (embedding <=> $1::vector)) as similarity
         FROM ${this.schema}.ddl_items
         WHERE (1 - (embedding <=> $1::vector)) > $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [
          `[${embedding.join(',')}]`,
          this.config.similarityThreshold || 0.7,
          limit
        ]
      );

      return result.rows.map((row: any) => ({
        item: {
          ddl: row.ddl,
          table_name: row.table_name,
        },
        similarity: row.similarity,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find similar documentation
   */
  async findSimilarDocumentation(
    embedding: number[], 
    limit: number = 5
  ): Promise<SimilarityResult<DocumentationItem>[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT content, title, (1 - (embedding <=> $1::vector)) as similarity
         FROM ${this.schema}.documentation_items
         WHERE (1 - (embedding <=> $1::vector)) > $2
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [
          `[${embedding.join(',')}]`,
          this.config.similarityThreshold || 0.7,
          limit
        ]
      );

      return result.rows.map((row: any) => ({
        item: {
          documentation: row.documentation,
          title: row.title,
        },
        similarity: row.similarity,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get summary of stored training data
   */
  async getTrainingSummary(): Promise<{
    questionSQLPairs: number;
    ddlItems: number;
    documentationItems: number;
  }> {
    const client = await this.pool.connect();
    
    try {
      const [questionsResult, ddlResult, docsResult] = await Promise.all([
        client.query(`SELECT COUNT(*) FROM ${this.schema}.question_sql_pairs`),
        client.query(`SELECT COUNT(*) FROM ${this.schema}.ddl_items`),
        client.query(`SELECT COUNT(*) FROM ${this.schema}.documentation_items`),
      ]);

      return {
        questionSQLPairs: parseInt(questionsResult.rows[0].count),
        ddlItems: parseInt(ddlResult.rows[0].count),
        documentationItems: parseInt(docsResult.rows[0].count),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Clear all training data
   */
  async clear(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await Promise.all([
        client.query(`DELETE FROM ${this.schema}.question_sql_pairs`),
        client.query(`DELETE FROM ${this.schema}.ddl_items`),
        client.query(`DELETE FROM ${this.schema}.documentation_items`),
      ]);
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
