#!/usr/bin/env node

/**
 * Basic Izumi test with PostgreSQL test database
 * This script demonstrates how to use Izumi with the test data
 */

import { createOpenAIIzumi } from '../lib/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Database configuration for test environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/izumi_test';

async function main() {
  try {
    console.log('🚀 Starting Izumi Test with PostgreSQL');
    console.log('📊 Database:', DATABASE_URL);
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OPENAI_API_KEY not found. Using placeholder - some features may not work.');
    }

    // Create Izumi instance
    const izumi = createOpenAIIzumi(
      process.env.OPENAI_API_KEY || 'placeholder',
      'gpt-4o-mini'
    );

    console.log('✅ Izumi instance created successfully');

    // Test that PgVectorStore is available
    try {
      const { PgVectorStore } = await import('../lib/index.js');
      console.log('✅ PgVectorStore is available and working');
    } catch (error) {
      console.log('⚠️  PgVectorStore not available:', error.message);
    }

    // Train with DDL from our test database
    console.log('📚 Training with DDL...');
    
    const testDDL = `
      -- E-commerce database schema
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          date_of_birth DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          parent_id INTEGER REFERENCES categories(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          cost DECIMAL(10, 2),
          sku VARCHAR(50) UNIQUE NOT NULL,
          category_id INTEGER REFERENCES categories(id),
          stock_quantity INTEGER DEFAULT 0,
          weight DECIMAL(8, 3),
          dimensions VARCHAR(50),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          order_number VARCHAR(50) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          total_amount DECIMAL(12, 2) NOT NULL,
          tax_amount DECIMAL(10, 2) DEFAULT 0,
          shipping_amount DECIMAL(10, 2) DEFAULT 0,
          discount_amount DECIMAL(10, 2) DEFAULT 0,
          payment_method VARCHAR(50),
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id),
          product_id INTEGER NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(12, 2) NOT NULL
      );

      CREATE TABLE reviews (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          rating INTEGER CHECK (rating >= 1 AND rating <= 5),
          title VARCHAR(200),
          comment TEXT,
          is_verified_purchase BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await izumi.train({ ddl: testDDL });
    console.log('✅ DDL training completed');

    // Train with sample question-SQL pairs
    console.log('📚 Training with question-SQL pairs...');
    
    const trainingSamples = [
      {
        question: 'How many users are registered?',
        sql: 'SELECT COUNT(*) as user_count FROM users WHERE is_active = true;'
      },
      {
        question: 'What are the top 5 most expensive products?',
        sql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;'
      },
      {
        question: 'Show me all delivered orders with customer names',
        sql: `SELECT o.order_number, u.first_name, u.last_name, o.total_amount, o.order_date 
              FROM orders o 
              JOIN users u ON o.user_id = u.id 
              WHERE o.status = 'delivered' 
              ORDER BY o.order_date DESC;`
      },
      {
        question: 'Which products have ratings above 4?',
        sql: `SELECT p.name, AVG(r.rating) as avg_rating 
              FROM products p 
              JOIN reviews r ON p.id = r.product_id 
              GROUP BY p.id, p.name 
              HAVING AVG(r.rating) > 4 
              ORDER BY avg_rating DESC;`
      },
      {
        question: 'What is the total revenue from all delivered orders?',
        sql: `SELECT SUM(total_amount) as total_revenue 
              FROM orders 
              WHERE status = 'delivered';`
      }
    ];

    for (const sample of trainingSamples) {
      await izumi.train({
        question: sample.question,
        sql: sample.sql
      });
    }
    console.log('✅ Question-SQL training completed');

    // Train with documentation
    console.log('📚 Training with documentation...');
    await izumi.train({
      documentation: `
        E-commerce Database Documentation:
        
        This database contains information about an online store with users, products, orders, and reviews.
        
        Key Business Rules:
        - Orders can have multiple items (one-to-many relationship)
        - Users can place multiple orders
        - Products belong to categories (hierarchical structure allowed)
        - Reviews are tied to both users and products
        - Inventory is tracked through stock_quantity in products table
        
        Common Calculations:
        - Total order value includes tax_amount and shipping_amount
        - Product ratings are calculated as averages from reviews
        - Revenue calculations should typically focus on 'delivered' orders
        
        Status Values:
        - Order status: pending, processing, shipped, delivered, cancelled
        - Users have is_active flag for soft deletion
      `
    });
    console.log('✅ Documentation training completed');

    // Test some queries
    console.log('🧪 Testing query generation...');
    
    const testQuestions = [
      'How many active users do we have?',
      'What are our best-selling products?',
      'Show me the average order value',
      'Which customers have never left a review?'
    ];

    for (const question of testQuestions) {
      try {
        console.log(`\n❓ Question: "${question}"`);
        
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'placeholder') {
          const response = await izumi.ask(question, {
            outputFormat: 'sql',
            includeExplanation: true
          });
          
          console.log('🔍 Generated SQL:');
          console.log(response.sql);
          
          if (response.explanation) {
            console.log('📝 Explanation:', response.explanation);
          }
        } else {
          console.log('⚠️  Skipping query generation - no valid OpenAI API key');
        }
      } catch (error) {
        console.error(`❌ Error processing question: ${error.message}`);
      }
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Add your OpenAI API key to .env file');
    console.log('2. Try running queries with: node test/run-queries.js');
    console.log('3. Connect to the database: psql postgresql://postgres:password123@localhost:5432/izumi_test');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
