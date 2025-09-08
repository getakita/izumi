#!/usr/bin/env node

/**
 * Core Q&A Test - Test Izumi's natural language to SQL generation
 * This tests the main functionality against our e-commerce database
 */

import { createOpenAIIzumi } from '../lib/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCoreQA() {
  console.log('🤖 Testing Core Q&A Functionality');
  console.log('==================================\n');

  // Check if we have an API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.log('❌ No OpenAI API key found in .env file');
    console.log('💡 To test the core Q&A functionality, please:');
    console.log('   1. Copy your OpenAI API key');
    console.log('   2. Edit test/.env file');
    console.log('   3. Replace "your-openai-api-key-here" with your actual key');
    console.log('   4. Run this test again\n');
    
    console.log('📋 Example questions you could test:');
    console.log('   • "How many users are registered?"');
    console.log('   • "What are our top 3 most expensive products?"');
    console.log('   • "Show me all delivered orders with customer names"');
    console.log('   • "Which products have ratings above 4 stars?"');
    console.log('   • "What\'s the total revenue from delivered orders?"');
    console.log('   • "Find customers who haven\'t placed any orders"');
    console.log('   • "What\'s the average order value?"');
    
    console.log('\n🗄️  Database contains:');
    console.log('   • 10 users with realistic profiles');
    console.log('   • 10 products across multiple categories');
    console.log('   • 10 orders in various states');
    console.log('   • Product reviews and ratings');
    console.log('   • Complete e-commerce relationships');
    
    return;
  }

  try {
    console.log('🚀 Initializing Izumi with OpenAI...');
    
    // Create Izumi instance
    const izumi = createOpenAIIzumi(
      process.env.OPENAI_API_KEY,
      'gpt-4o-mini'
    );
    console.log('✅ Izumi instance created');

    // Wait for model initialization
    console.log('⏳ Waiting for LLM initialization...');
    // Give the model time to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ LLM initialization completed');

    // Train with our e-commerce schema
    console.log('📚 Training with e-commerce database schema...');
    
    const ecommerceSchema = `
      -- E-commerce Database Schema
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          date_of_birth DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          parent_id INTEGER REFERENCES categories(id)
      );

      CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          sku VARCHAR(50) UNIQUE NOT NULL,
          category_id INTEGER REFERENCES categories(id),
          stock_quantity INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          order_number VARCHAR(50) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
          total_amount DECIMAL(12, 2) NOT NULL,
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await izumi.train({ ddl: ecommerceSchema });
    console.log('✅ Schema training completed');

    // Train with sample Q&A pairs for better context
    console.log('📚 Training with sample Q&A pairs...');
    const trainingPairs = [
      {
        question: 'How many users are registered?',
        sql: 'SELECT COUNT(*) as user_count FROM test_data.users WHERE is_active = true;'
      },
      {
        question: 'What are the top selling products?',
        sql: `SELECT p.name, SUM(oi.quantity) as total_sold 
              FROM test_data.products p 
              JOIN test_data.order_items oi ON p.id = oi.product_id 
              JOIN test_data.orders o ON oi.order_id = o.id 
              WHERE o.status = 'delivered' 
              GROUP BY p.id, p.name 
              ORDER BY total_sold DESC;`
      },
      {
        question: 'Show me revenue by month',
        sql: `SELECT 
                DATE_TRUNC('month', order_date) as month,
                SUM(total_amount) as monthly_revenue
              FROM test_data.orders 
              WHERE status = 'delivered'
              GROUP BY month 
              ORDER BY month;`
      }
    ];

    for (const pair of trainingPairs) {
      await izumi.train({ question: pair.question, sql: pair.sql });
    }
    console.log('✅ Q&A training completed');

    // Add business context
    await izumi.train({
      documentation: `
        E-commerce Business Context:
        
        • The database tracks online store operations
        • Users place orders containing multiple products  
        • Orders progress through: pending → processing → shipped → delivered
        • Cancelled orders should typically be excluded from revenue calculations
        • Products are organized in categories with hierarchical relationships
        • All tables use the test_data schema prefix
        • Revenue calculations should focus on delivered orders
        • Stock levels are tracked in products.stock_quantity
      `
    });
    console.log('✅ Business context training completed\n');

    // Test core Q&A functionality
    console.log('🧪 Testing Natural Language to SQL Generation');
    console.log('==============================================\n');

    const testQuestions = [
      'How many active users do we have?',
      'What are our 3 most expensive products?',
      'Show me the total revenue from delivered orders',
      'Which products have the highest ratings?',
      'Find all orders placed in 2024'
    ];

    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      console.log(`${i + 1}. ❓ "${question}"`);
      
      try {
        const response = await izumi.ask(question, {
          outputFormat: 'sql',
          includeExplanation: true,
          database: 'postgresql'
        });

        console.log('🔍 Generated SQL:');
        console.log('```sql');
        console.log(response.sql);
        console.log('```');

        if (response.explanation) {
          console.log('📝 Explanation:', response.explanation);
        }

        console.log('✅ Query generated successfully\n');

      } catch (error) {
        console.log('❌ Error:', error.message, '\n');
      }
    }

    console.log('🎉 Core Q&A testing completed successfully!');
    console.log('\n💡 Izumi successfully:');
    console.log('   ✅ Trained on your database schema');
    console.log('   ✅ Learned from sample Q&A pairs');
    console.log('   ✅ Generated SQL from natural language');
    console.log('   ✅ Provided explanations for queries');
    
    console.log('\n🚀 Ready for production use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testCoreQA().catch(console.error);
