import {
  QuestionSQLPair,
  DDLItem,
  DocumentationItem,
  SimilarityResult,
  EmbeddingResponse,
} from '../types/index.js';

/**
 * Simple in-memory vector store for storing and retrieving training data
 * Uses cosine similarity for finding related items
 */
export class MemoryVectorStore {
  private questionSQLPairs: QuestionSQLPair[] = [];
  private ddlItems: DDLItem[] = [];
  private documentationItems: DocumentationItem[] = [];

  async addQuestionSQL(question: string, sql: string, embedding: number[]): Promise<string> {
    const id = this.generateId('qs');
    const item: QuestionSQLPair = {
      id,
      question,
      sql,
      embedding,
    };
    
    this.questionSQLPairs.push(item);
    return id;
  }

  async addDDL(ddl: string, embedding: number[], tableName?: string): Promise<string> {
    const id = this.generateId('ddl');
    const item: DDLItem = {
      id,
      ddl,
      table_name: tableName,
      embedding,
    };
    
    this.ddlItems.push(item);
    return id;
  }

  async addDocumentation(documentation: string, embedding: number[], title?: string): Promise<string> {
    const id = this.generateId('doc');
    const item: DocumentationItem = {
      id,
      documentation,
      title,
      embedding,
    };
    
    this.documentationItems.push(item);
    return id;
  }

  async getSimilarQuestionSQL(queryEmbedding: number[], limit: number = 5): Promise<QuestionSQLPair[]> {
    const similarities = this.questionSQLPairs
      .filter(item => item.embedding)
      .map(item => ({
        item,
        similarity: this.cosineSimilarity(queryEmbedding, item.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(s => s.item);
  }

  async getRelatedDDL(queryEmbedding: number[], limit: number = 10): Promise<DDLItem[]> {
    const similarities = this.ddlItems
      .filter(item => item.embedding)
      .map(item => ({
        item,
        similarity: this.cosineSimilarity(queryEmbedding, item.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(s => s.item);
  }

  async getRelatedDocumentation(queryEmbedding: number[], limit: number = 5): Promise<DocumentationItem[]> {
    const similarities = this.documentationItems
      .filter(item => item.embedding)
      .map(item => ({
        item,
        similarity: this.cosineSimilarity(queryEmbedding, item.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(s => s.item);
  }

  async removeTrainingData(id: string): Promise<boolean> {
    const initialLengths = {
      qs: this.questionSQLPairs.length,
      ddl: this.ddlItems.length,
      doc: this.documentationItems.length,
    };

    this.questionSQLPairs = this.questionSQLPairs.filter(item => item.id !== id);
    this.ddlItems = this.ddlItems.filter(item => item.id !== id);
    this.documentationItems = this.documentationItems.filter(item => item.id !== id);

    const finalLengths = {
      qs: this.questionSQLPairs.length,
      ddl: this.ddlItems.length,
      doc: this.documentationItems.length,
    };

    return (
      initialLengths.qs !== finalLengths.qs ||
      initialLengths.ddl !== finalLengths.ddl ||
      initialLengths.doc !== finalLengths.doc
    );
  }

  async getTrainingData(): Promise<{
    questionSQL: QuestionSQLPair[];
    ddl: DDLItem[];
    documentation: DocumentationItem[];
  }> {
    return {
      questionSQL: [...this.questionSQLPairs],
      ddl: [...this.ddlItems],
      documentation: [...this.documentationItems],
    };
  }

  async findDDLByTableName(tableName: string): Promise<DDLItem[]> {
    return this.ddlItems.filter(item => 
      item.table_name?.toLowerCase() === tableName.toLowerCase() ||
      item.ddl.toLowerCase().includes(tableName.toLowerCase())
    );
  }

  async searchQuestionSQL(query: string): Promise<QuestionSQLPair[]> {
    const queryLower = query.toLowerCase();
    return this.questionSQLPairs.filter(item =>
      item.question.toLowerCase().includes(queryLower) ||
      item.sql.toLowerCase().includes(queryLower)
    );
  }

  async getStatistics(): Promise<{
    questionSQLCount: number;
    ddlCount: number;
    documentationCount: number;
    totalItems: number;
  }> {
    return {
      questionSQLCount: this.questionSQLPairs.length,
      ddlCount: this.ddlItems.length,
      documentationCount: this.documentationItems.length,
      totalItems: this.questionSQLPairs.length + this.ddlItems.length + this.documentationItems.length,
    };
  }

  clear(): void {
    this.questionSQLPairs = [];
    this.ddlItems = [];
    this.documentationItems = [];
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  // Export/Import functionality
  export(): string {
    return JSON.stringify({
      questionSQLPairs: this.questionSQLPairs,
      ddlItems: this.ddlItems,
      documentationItems: this.documentationItems,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  import(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.questionSQLPairs) {
        this.questionSQLPairs = data.questionSQLPairs;
      }
      
      if (data.ddlItems) {
        this.ddlItems = data.ddlItems;
      }
      
      if (data.documentationItems) {
        this.documentationItems = data.documentationItems;
      }
    } catch (error) {
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
