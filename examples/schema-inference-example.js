// Simple Example: Auto-initialize with database and start asking questions
import { createOpenAIWithDatabase } from '../lib/index.js';

// Example database connection (replace with your actual database)
const dbConnection = {
  type: 'postgresql', // or 'mysql', 'sqlite'
  runSQL: async (sql) => {
    // Replace this with your actual database connection
    // For PostgreSQL: use pg.Client
    // For MySQL: use mysql2
    // For SQLite: use sqlite3 or better-sqlite3

    console.log('Executing SQL:', sql);

    // Mock response - replace with actual database query
    if (sql.includes('information_schema')) {
      return [
        { ddl: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(255));' },
        { ddl: 'CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER, total DECIMAL(10,2));' }
      ];
    }

    return [];
  }
};

// Create Izumi with auto-initialization
async function main() {
  console.log('🚀 Starting Izumi with auto-initialization...\n');

  // Just provide API key and database connection - that's it!
  const izumi = createOpenAIWithDatabase(
    process.env.OPENAI_API_KEY,
    dbConnection
  );

  // Wait a moment for auto-initialization to complete
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n❓ Ready! Ask your first question:\n');

  // Start asking questions immediately
  const questions = [
    'How many users do we have?',
    'What are the total sales?',
    'Show me all user emails',
    'Which users have placed orders?'
  ];

  for (const question of questions) {
    console.log(`🤔 ${question}`);
    try {
      const result = await izumi.ask(question);
      console.log(`🔍 SQL: ${result.sql}`);
      console.log(`✅ Ready for next question!\n`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('🎉 Demo complete! Izumi is ready to answer questions about your database.');
}

// Handle missing API key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Please set OPENAI_API_KEY environment variable');
  console.log('Example: OPENAI_API_KEY=your-key-here node examples/simple-example.js');
  process.exit(1);
}

main().catch(console.error);
