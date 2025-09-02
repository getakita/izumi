/**
 * Complete example demonstrating Izumi following Vanna.AI pattern
 * This example shows the full workflow: training and asking questions
 */

import { createOpenAIIzumi, createAnthropicIzumi } from '../src/index.js';

async function completeVannaExample() {
  console.log('🚀 Izumi - Vanna.AI Pattern Example\n');

  // Create an Izumi instance with OpenAI (like Vanna)
  const izumi = createOpenAIIzumi('your-openai-api-key');

  console.log('📚 Training Phase - Adding Knowledge to RAG System');
  
  // 1. Train with DDL (like vn.train(ddl=...))
  console.log('  → Training with DDL schema...');
  await izumi.train({
    ddl: `
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100)
      );
    `
  });

  // 2. Train with documentation (like vn.train(documentation=...))
  console.log('  → Training with business documentation...');
  await izumi.train({
    documentation: `
      Customer table contains customer information including contact details.
      Orders table tracks customer purchases with status tracking.
      Products table contains our inventory with pricing and categorization.
      Order status can be: pending, processing, shipped, delivered, cancelled.
    `
  });

  // 3. Train with example SQL (like vn.train(sql=...))
  console.log('  → Training with example queries...');
  await izumi.train({
    question: 'Get all customers',
    sql: 'SELECT * FROM customers ORDER BY created_at DESC'
  });

  await izumi.train({
    question: 'Get customer order history',
    sql: `
      SELECT c.name, c.email, o.total, o.status, o.created_at
      FROM customers c 
      JOIN orders o ON c.id = o.customer_id 
      ORDER BY o.created_at DESC
    `
  });

  await izumi.train({
    question: 'Get total sales by customer',
    sql: `
      SELECT c.name, COUNT(o.id) as order_count, SUM(o.total) as total_sales
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id, c.name
      ORDER BY total_sales DESC NULLS LAST
    `
  });

  console.log('\n❓ Question Phase - Using RAG to Generate SQL\n');

  // 4. Ask questions (like vn.ask(...))
  const questions = [
    "What are the top 5 customers by total order value?",
    "Show me all pending orders from this week",
    "Which products have never been ordered?",
    "Get the average order value by customer"
  ];

  for (const [index, question] of questions.entries()) {
    console.log(`Question ${index + 1}: ${question}`);
    
    try {
      const result = await izumi.ask(question);
      console.log('Generated SQL:');
      console.log(result.sql);
      console.log('Explanation:');
      console.log(result.explanation);
      console.log('---\n');
    } catch (error) {
      console.error(`Error: ${error.message}\n`);
    }
  }

  // 5. Direct SQL generation (bypassing RAG retrieval)
  console.log('🎯 Direct SQL Generation (bypassing RAG)\n');
  const directSQL = await izumi.generateSQL('Find customers who have spent more than $1000 total');
  console.log('Direct SQL:', directSQL);

  // 6. Schema export capabilities
  console.log('\n📤 Schema Export Examples\n');
  
  const jsonSchema = izumi.exportSchema({ format: 'json' });
  console.log('JSON Schema (first table):');
  console.log(JSON.stringify(JSON.parse(jsonSchema).tables[0], null, 2));

  const drizzleSchema = izumi.exportSchema({ format: 'drizzle' });
  console.log('\nDrizzle Schema (sample):');
  console.log(drizzleSchema.substring(0, 300) + '...');
}

async function multiProviderExample() {
  console.log('\n🔄 Multi-Provider Example\n');

  const providers = [
    { name: 'OpenAI', instance: createOpenAIIzumi('openai-key') },
    { name: 'Anthropic', instance: createAnthropicIzumi('anthropic-key') }
  ];

  const question = 'Get monthly revenue trends';

  console.log(`Question: ${question}\n`);

  for (const { name, instance } of providers) {
    console.log(`${name} Provider:`);
    
    // Train with basic schema
    await instance.train({
      ddl: 'CREATE TABLE sales (id SERIAL PRIMARY KEY, amount DECIMAL(10,2), sale_date DATE);'
    });

    try {
      const result = await instance.ask(question);
      console.log('SQL:', result.sql);
      console.log('---');
    } catch (error) {
      console.log('Error:', error.message);
      console.log('---');
    }
  }
}

// Comparison with Vanna.AI API
function vannaComparison() {
  console.log('\n📋 API Comparison with Vanna.AI\n');
  
  console.log('Vanna.AI (Python):');
  console.log(`
  # Training
  vn.train(ddl="CREATE TABLE users ...")
  vn.train(documentation="Users table contains ...")
  vn.train(sql="SELECT * FROM users")
  
  # Asking
  result = vn.ask("Get all users")
  print(result)
  `);

  console.log('Izumi (TypeScript):');
  console.log(`
  // Training
  await izumi.train({ ddl: "CREATE TABLE users ..." });
  await izumi.train({ documentation: "Users table contains ..." });
  await izumi.train({ question: "Get all users", sql: "SELECT * FROM users" });
  
  // Asking
  const result = await izumi.ask("Get all users");
  console.log(result.sql);
  `);
}

// Export for use
export { completeVannaExample, multiProviderExample, vannaComparison };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.all([
    completeVannaExample(),
    multiProviderExample(),
    vannaComparison()
  ]).catch(console.error);
}
