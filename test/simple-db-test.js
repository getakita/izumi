#!/usr/bin/env node

/**
 * Simple database connection test for Izumi
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/izumi_test';

async function testDatabaseQueries() {
  console.log('🧪 Testing SQL Queries on Sample Data');
  console.log('=====================================\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    
    // Test queries that demonstrate what Izumi might generate
    const testQueries = [
      {
        description: "How many users are registered?",
        sql: "SELECT COUNT(*) as user_count FROM test_data.users WHERE is_active = true;"
      },
      {
        description: "What are the top 3 most expensive products?",
        sql: "SELECT name, price FROM test_data.products ORDER BY price DESC LIMIT 3;"
      },
      {
        description: "Show delivered orders with customer names",
        sql: `SELECT o.order_number, u.first_name, u.last_name, o.total_amount, o.order_date 
              FROM test_data.orders o 
              JOIN test_data.users u ON o.user_id = u.id 
              WHERE o.status = 'delivered' 
              ORDER BY o.order_date DESC;`
      },
      {
        description: "Which products have ratings above 4?",
        sql: `SELECT p.name, AVG(r.rating)::numeric(3,2) as avg_rating, COUNT(r.id) as review_count
              FROM test_data.products p 
              JOIN test_data.reviews r ON p.id = r.product_id 
              GROUP BY p.id, p.name 
              HAVING AVG(r.rating) > 4 
              ORDER BY avg_rating DESC;`
      },
      {
        description: "What is the total revenue from delivered orders?",
        sql: `SELECT SUM(total_amount)::numeric(12,2) as total_revenue 
              FROM test_data.orders 
              WHERE status = 'delivered';`
      }
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`${i + 1}. ${query.description}`);
      console.log(`SQL: ${query.sql.replace(/\s+/g, ' ').trim()}`);
      
      try {
        const result = await client.query(query.sql);
        console.log('Results:');
        
        if (result.rows.length > 0) {
          // Pretty print the results
          result.rows.forEach((row, index) => {
            const rowStr = Object.entries(row)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            console.log(`   ${index + 1}. ${rowStr}`);
          });
        } else {
          console.log('   No results found');
        }
        console.log('✅ Query executed successfully\n');
        
      } catch (error) {
        console.log(`❌ Query failed: ${error.message}\n`);
      }
    }
    
    client.release();
    console.log('🎉 All test queries completed!');
    console.log('\n💡 These are examples of SQL queries that Izumi can generate');
    console.log('   from natural language questions like:');
    testQueries.forEach((q, i) => {
      console.log(`   ${i + 1}. "${q.description}"`);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseQueries().catch(console.error);
