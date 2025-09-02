/**
 * Basic usage example of Izumi - Simplified Auto-Initialization
 */
import { createOpenAIWithDatabase, createAnthropicWithDatabase } from '../src/index.js';

async function basicExample() {
  console.log('🚀 Basic Izumi Example with Auto-Initialization\n');

  // Example database connection (replace with your actual DB)
  const dbConnection = {
    type: 'postgresql' as const,
    runSQL: async (sql: string) => {
      // Mock database response for demo
      console.log('📊 Executing SQL:', sql);

      if (sql.includes('information_schema')) {
        return [
          { ddl: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);' },
          { ddl: 'CREATE TABLE posts (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, content TEXT, user_id INTEGER REFERENCES users(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);' }
        ];
      }

      return [];
    }
  };

  // Create Izumi with auto-initialization - that's it!
  const izumi = createOpenAIWithDatabase('your-openai-api-key', dbConnection);

  // Wait for auto-initialization to complete
  console.log('⏳ Auto-initializing with database schema...');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for async initialization
  console.log('✅ Ready to answer questions!\n');

  // Ask questions immediately - no manual training needed!
  console.log('❓ Asking questions:\n');

  const questions = [
    'Show me all users created in the last week',
    'Get the latest 5 posts with author information',
    'Count total posts per user',
    'Find users who haven\'t posted anything'
  ];

  for (const question of questions) {
    console.log(`🤔 ${question}`);
    try {
      const response = await izumi.ask(question);
      console.log(`🔍 SQL: ${response.sql}`);
      if (response.explanation) {
        console.log(`💡 ${response.explanation}`);
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  // Export schema if needed
  console.log('📄 Exporting schema:');
  const jsonSchema = izumi.exportSchema({ format: 'json' });
  console.log('JSON Schema length:', jsonSchema.length);

  console.log('\n🎉 Basic example completed!');
}

async function advancedExample() {
  console.log('🚀 Advanced Example with Anthropic\n');

  // Database connection
  const dbConnection = {
    type: 'postgresql' as const,
    runSQL: async (sql: string) => {
      console.log('📊 Executing SQL:', sql);
      // Mock response
      if (sql.includes('information_schema')) {
        return [
          { ddl: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(255));' },
          { ddl: 'CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER, total DECIMAL(10,2));' }
        ];
      }
      return [];
    }
  };

  // Use Anthropic instead of OpenAI
  const izumi = createAnthropicWithDatabase('your-anthropic-api-key', dbConnection);

  await new Promise(resolve => setTimeout(resolve, 3000));

  const response = await izumi.ask('Find users who haven\'t placed any orders');
  console.log('🔍 SQL:', response.sql);
  console.log('✅ Advanced example completed!');
}

async function multiProviderExample() {
  console.log('🚀 Multi-Provider Comparison\n');

  const dbConnection = {
    type: 'postgresql' as const,
    runSQL: async (sql: string) => {
      if (sql.includes('information_schema')) {
        return [
          { ddl: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));' },
          { ddl: 'CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INTEGER, created_at TIMESTAMP);' }
        ];
      }
      return [];
    }
  };

  // Compare different providers
  const providers = [
    { name: 'OpenAI', instance: createOpenAIWithDatabase('openai-key', dbConnection) },
    { name: 'Anthropic', instance: createAnthropicWithDatabase('anthropic-key', dbConnection) }
  ];

  const question = 'Get users who have posted in the last month';

  for (const provider of providers) {
    console.log(`🤖 Testing ${provider.name}:`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    const response = await provider.instance.ask(question);
    console.log(`🔍 SQL: ${response.sql}\n`);
  }

  console.log('✅ Multi-provider comparison completed!');
}

export { basicExample, advancedExample, multiProviderExample };
