// Example: Using Izumi with OpenAI embeddings and PostgreSQL pgvector
import { createOpenAIWithPgVector } from '../lib/index.js';

// PostgreSQL configuration
const pgConfig = {
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
    // Create Izumi instance with OpenAI and pgvector
    const izumi = createOpenAIWithPgVector(
      process.env.OPENAI_API_KEY, 
      pgConfig,
      'gpt-4o-mini'
    );

    // Initialize the vector store (creates tables if needed)
    await izumi.initialize();

    // Train with DDL
    await izumi.trainDDL(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Train with question-SQL pairs
    await izumi.trainQuestionSQL('How many users are there?', 'SELECT COUNT(*) FROM users;');
    await izumi.trainQuestionSQL('Get all user emails', 'SELECT email FROM users;');

    // Train with documentation
    await izumi.trainDocumentation('The users table stores user information including names and emails');

    // Ask a question
    const response = await izumi.ask('Show me all users with their creation date');
    
    console.log('Generated SQL:', response.sql);
    console.log('Explanation:', response.explanation);
    console.log('Similar questions:', response.metadata?.similarQuestions);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();
