#!/usr/bin/env node

/**
 * Database connection test and utility script
 * This script tests the connection to PostgreSQL and provides useful database commands
 */

import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/izumi_test';

async function testConnection() {
  console.log('🔌 Testing PostgreSQL connection...');
  console.log('📍 Database URL:', DATABASE_URL);

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if pgvector extension is available
    const vectorCheck = await client.query("SELECT extname FROM pg_extension WHERE extname = 'vector';");
    if (vectorCheck.rows.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('⚠️  pgvector extension not found');
    }

    // Get basic database info
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `);
    
    console.log('\n📊 Database Information:');
    console.log(`   Database: ${dbInfo.rows[0].database_name}`);
    console.log(`   User: ${dbInfo.rows[0].current_user}`);
    console.log(`   Version: ${dbInfo.rows[0].postgres_version.split(' ')[0]} ${dbInfo.rows[0].postgres_version.split(' ')[1]}`);

    // Check schemas
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('test_data', 'izumi', 'public')
      ORDER BY schema_name;
    `);
    
    console.log('\n📁 Available Schemas:');
    for (const schema of schemas.rows) {
      console.log(`   • ${schema.schema_name}`);
    }

    // Check tables in test_data schema
    const tables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'test_data'
      ORDER BY table_name;
    `);

    if (tables.rows.length > 0) {
      console.log('\n🗂️  Tables in test_data schema:');
      for (const table of tables.rows) {
        // Get row count for each table
        const countResult = await client.query(`SELECT COUNT(*) FROM test_data.${table.table_name}`);
        console.log(`   • ${table.table_name} (${countResult.rows[0].count} rows)`);
      }
    } else {
      console.log('\n⚠️  No tables found in test_data schema');
    }

    client.release();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure Docker is running');
      console.log('   2. Start the database: docker-compose up -d');
      console.log('   3. Wait for the database to be ready (check health status)');
    }
  } finally {
    await pool.end();
  }
}

async function showSampleData() {
  console.log('\n📋 Sample Data Preview:');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    
    // Sample users
    const users = await client.query('SELECT first_name, last_name, email FROM test_data.users LIMIT 3');
    console.log('\n👥 Users (first 3):');
    for (const user of users.rows) {
      console.log(`   • ${user.first_name} ${user.last_name} (${user.email})`);
    }

    // Sample products
    const products = await client.query('SELECT name, price FROM test_data.products LIMIT 3');
    console.log('\n🛍️  Products (first 3):');
    for (const product of products.rows) {
      console.log(`   • ${product.name} - $${product.price}`);
    }

    // Sample orders
    const orders = await client.query(`
      SELECT o.order_number, u.first_name, o.status, o.total_amount 
      FROM test_data.orders o 
      JOIN test_data.users u ON o.user_id = u.id 
      LIMIT 3
    `);
    console.log('\n📦 Orders (first 3):');
    for (const order of orders.rows) {
      console.log(`   • ${order.order_number} by ${order.first_name} - ${order.status} ($${order.total_amount})`);
    }

    client.release();
  } catch (error) {
    console.error('❌ Error fetching sample data:', error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🧪 Izumi PostgreSQL Test Utility');
  console.log('=================================\n');

  await testConnection();
  await showSampleData();

  console.log('\n🚀 Ready to test Izumi!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Copy .env.example to .env and add your OpenAI API key');
  console.log('   2. Run: node test/basic-test.js');
  console.log('   3. Run: node test/run-queries.js (for interactive testing)');
}

main().catch(console.error);
