/**
 * Basic usage example of Izumi following Vanna.AI pattern
 */
import { createOpenAIIzumi, createAnthropicIzumi, Izumi } from '../src/index.js';

async function basicExample() {
  // Create an Izumi instance with OpenAI
  const izumi = createOpenAIIzumi('your-openai-api-key');

  // 1. Train with DDL schema
  await izumi.train({
    ddl: `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  });

  // 2. Train with documentation
  await izumi.train({
    documentation: 'Users table contains user information. Posts table contains blog posts written by users.'
  });

  // 3. Train with example question-SQL pairs
  await izumi.train({
    question: 'Get all users',
    sql: 'SELECT * FROM users'
  });

  await izumi.train({
    question: 'Get posts with user names',
    sql: 'SELECT p.*, u.name as author_name FROM posts p JOIN users u ON p.user_id = u.id'
  });

  // 4. Ask questions
  const response1 = await izumi.ask('Show me all users created in the last week');
  console.log('SQL:', response1.sql);
  console.log('Explanation:', response1.explanation);

  const response2 = await izumi.ask('Get the latest 5 posts with author information');
  console.log('SQL:', response2.sql);

  // 5. Generate SQL directly (bypasses retrieval)
  const directSQL = await izumi.generateSQL('Count total posts per user');
  console.log('Direct SQL:', directSQL);

  // 6. Export schema in different formats
  const jsonSchema = izumi.exportSchema({ format: 'json' });
  console.log('JSON Schema:', jsonSchema);

  const drizzleSchema = izumi.exportSchema({ format: 'drizzle' });
  console.log('Drizzle Schema:', drizzleSchema);
}

async function advancedExample() {
  // Using custom configuration
  const izumi = new Izumi({
    llm: {
      provider: 'anthropic',
      apiKey: 'your-anthropic-api-key',
      model: 'claude-3-5-sonnet-20241022'
    }
    // vectorStore config can be omitted to use defaults
  });

  // Train with Drizzle schema
  const drizzleSchema = {
    users: {
      id: { type: 'serial', primaryKey: true },
      name: { type: 'varchar', length: 100, notNull: true },
      email: { type: 'varchar', length: 255, unique: true, notNull: true }
    }
  };

  await izumi.train({
    ddl: JSON.stringify(drizzleSchema)
  });

  // Ask with additional context
  const response = await izumi.ask('Find users with duplicate emails');

  console.log('Response:', response);
}

async function multiProviderExample() {
  // Compare different providers
  const providers = [
    createOpenAIIzumi('openai-key'),
    createAnthropicIzumi('anthropic-key')
  ];

  const question = 'Get users who have posted in the last month';

  for (const [index, izumi] of providers.entries()) {
    // Train each with the same data
    await izumi.train({
      ddl: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100)); CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INTEGER, created_at TIMESTAMP);'
    });

    const response = await izumi.ask(question);
    console.log(`Provider ${index + 1} SQL:`, response.sql);
  }
}

export { basicExample, advancedExample, multiProviderExample };
