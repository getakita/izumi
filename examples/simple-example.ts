/**
 * Simple example following Vanna.AI pattern
 */
import { createOpenAIIzumi } from '../src/index.js';

async function simpleExample() {
  // Create an Izumi instance with OpenAI
  const izumi = createOpenAIIzumi('your-openai-api-key');

  // Train with DDL
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
    `
  });

  // Train with documentation
  await izumi.train({
    documentation: 'Customers table contains customer information. Orders table contains purchase orders.'
  });

  // Train with examples
  await izumi.train({
    question: 'Get all customers',
    sql: 'SELECT * FROM customers'
  });

  // Ask questions
  const result = await izumi.ask('What are the top 10 customers by order total?');
  console.log('Generated SQL:', result.sql);
  console.log('Explanation:', result.explanation);
}

// Run example
simpleExample().catch(console.error);
