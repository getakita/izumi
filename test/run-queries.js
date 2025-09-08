#!/usr/bin/env node

/**
 * Interactive query runner for testing Izumi with PostgreSQL
 * This script allows you to ask questions and see the generated SQL
 */

import { createOpenAIIzumi } from '../lib/index.js';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🤖 Izumi Interactive Query Runner');
  console.log('=====================================\n');

  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ Error: OPENAI_API_KEY not found in .env file');
    console.log('Please add your OpenAI API key to the .env file in the test directory.\n');
    process.exit(1);
  }

  try {
    // Create Izumi instance
    const izumi = createOpenAIIzumi(
      process.env.OPENAI_API_KEY,
      'gpt-4o-mini'
    );

    // Quick training with essential schema info
    console.log('📚 Loading database schema...');
    
    await izumi.train({
      ddl: `
        CREATE TABLE users (id SERIAL PRIMARY KEY, first_name VARCHAR(50), last_name VARCHAR(50), email VARCHAR(100), is_active BOOLEAN);
        CREATE TABLE categories (id SERIAL PRIMARY KEY, name VARCHAR(100), parent_id INTEGER);
        CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(200), price DECIMAL(10,2), category_id INTEGER, stock_quantity INTEGER);
        CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INTEGER, order_number VARCHAR(50), status VARCHAR(20), total_amount DECIMAL(12,2), order_date TIMESTAMP);
        CREATE TABLE order_items (id SERIAL PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price DECIMAL(10,2));
        CREATE TABLE reviews (id SERIAL PRIMARY KEY, product_id INTEGER, user_id INTEGER, rating INTEGER, comment TEXT);
      `
    });

    console.log('✅ Schema loaded successfully\n');

    console.log('💡 Try asking questions like:');
    console.log('   • "How many users are registered?"');
    console.log('   • "What are the top 5 most expensive products?"');
    console.log('   • "Show me all orders from this year"');
    console.log('   • "Which products have the best ratings?"');
    console.log('   • Type "quit" to exit\n');

    while (true) {
      const question = await askQuestion('❓ Your question: ');
      
      if (question.toLowerCase() === 'quit' || question.toLowerCase() === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      if (!question.trim()) {
        continue;
      }

      try {
        console.log('🔄 Generating SQL...\n');
        
        const response = await izumi.ask(question, {
          outputFormat: 'sql',
          includeExplanation: true,
          database: 'postgresql'
        });

        console.log('🔍 Generated SQL:');
        console.log('```sql');
        console.log(response.sql);
        console.log('```\n');

        if (response.explanation) {
          console.log('📝 Explanation:');
          console.log(response.explanation);
          console.log();
        }

        if (response.metadata) {
          console.log('📊 Metadata:');
          if (response.metadata.tablesUsed?.length > 0) {
            console.log(`   Tables used: ${response.metadata.tablesUsed.join(', ')}`);
          }
          if (response.metadata.queryType) {
            console.log(`   Query type: ${response.metadata.queryType}`);
          }
          console.log();
        }

        // Suggest running the query
        console.log('💡 To run this query on your database:');
        console.log('   psql postgresql://postgres:password123@localhost:5432/izumi_test -c "' + response.sql.replace(/"/g, '\\"') + '"');
        console.log();

      } catch (error) {
        console.error('❌ Error generating SQL:', error.message);
        console.log();
      }
    }

  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
