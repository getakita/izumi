/**
 * Simple example - Just provide LLM + Database, start asking questions!
 */
import { createOpenAIWithDatabase } from '../src/index.js';

async function simpleExample() {
  console.log('🚀 Simple Izumi Example\n');

  // Database connection (replace with your actual database)
  const dbConnection = {
    type: 'postgresql' as const,
    runSQL: async (sql: string) => {
      console.log('📊 Executing SQL:', sql);

      // Mock response for demo - replace with actual DB query
      if (sql.includes('information_schema')) {
        return [
          { ddl: 'CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);' },
          { ddl: 'CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), total DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT \'pending\', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);' }
        ];
      }

      return [];
    }
  };

  // Just provide API key and database connection - that's it!
  const izumi = createOpenAIWithDatabase('your-openai-api-key', dbConnection);

  // Wait for auto-initialization
  console.log('⏳ Auto-initializing...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('✅ Ready!\n');

  // Ask questions immediately - no manual training needed!
  const result = await izumi.ask('What are the top 10 customers by order total?');

  console.log('🔍 Generated SQL:', result.sql);
  if (result.explanation) {
    console.log('💡 Explanation:', result.explanation);
  }

  console.log('\n🎉 That\'s it! Izumi handled everything automatically.');
}

// Run example
simpleExample().catch(console.error);
