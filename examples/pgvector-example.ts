// Example: Using Izumi with OpenAI embeddings and PostgreSQL pgvector
import { createOpenAIIzumi, type PgVectorConfig, type Izumi } from '../src/index.js';

// PostgreSQL configuration
const pgConfig: PgVectorConfig = {
  host: 'localhost',
  port: 5432,
  database: 'izumi_vectors',
  user: 'postgres',
  password: 'your-password',
  ssl: false,
  schema: 'izumi',
  embeddingDimension: 1536, // OpenAI text-embedding-3-small dimension
  similarityThreshold: 0.7
};

async function main() {
  try {
    // Create Izumi instance with OpenAI
    const izumi: Izumi = createOpenAIIzumi(
      process.env.OPENAI_API_KEY!,
      'gpt-4o-mini'
    );

    // Note: To use pgvector, you need to configure the vector store separately
    // For this example, we'll use memory store, but you can modify the config

    // Train with DDL
    await izumi.train({
      ddl: `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    // Train with question-SQL pairs
    await izumi.train({
      question: 'How many users are there?',
      sql: 'SELECT COUNT(*) FROM users;'
    });
    await izumi.train({
      question: 'Get all user emails',
      sql: 'SELECT email FROM users;'
    });

    // Train with documentation
    await izumi.train({
      documentation: 'The users table stores user information including names and emails'
    });

    // Ask a question
    const response = await izumi.ask('Show me all users with their creation date');
    
    console.log('Generated SQL:', response.sql);
    console.log('Explanation:', response.explanation);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();
