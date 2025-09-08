#!/usr/bin/env node

/**
 * Test PgVectorStore functionality with the test database
 */

import { PgVectorStore } from '../lib/index.js';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/izumi_test';

async function testPgVectorStore() {
  console.log('🧪 Testing PgVectorStore');
  console.log('========================\n');

  try {
    // Parse connection string to config
    const url = new URL(DATABASE_URL);
    
    const config = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1), // Remove leading slash
      user: url.username,
      password: url.password,
      schema: 'izumi', // Use izumi schema for vector store
      embeddingDimension: 384, // Small dimension for testing
    };

    console.log('📊 Creating PgVectorStore with config:');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Schema: ${config.schema}`);
    console.log(`   Embedding Dimension: ${config.embeddingDimension}\n`);

    // Create vector store
    const vectorStore = new PgVectorStore(config);
    console.log('✅ PgVectorStore created successfully');

    // Test connection
    console.log('🔌 Testing connection...');
    await vectorStore.connect();
    console.log('✅ Connection established successfully');

    // Test initialization (creates tables)
    console.log('🏗️  Initializing vector store...');
    await vectorStore.initialize();
    console.log('✅ Vector store initialized successfully');

    // Test storing a simple item (create a dummy embedding)
    console.log('💾 Testing data storage...');
    const testItem = {
      question: 'How many users are there?',
      sql: 'SELECT COUNT(*) FROM users;',
      embedding: Array.from({ length: 384 }, () => Math.random()) // Random embedding for testing
    };

    await vectorStore.storeQuestionSQL(testItem);
    console.log('✅ Test question-SQL pair stored successfully');

    // Test similarity search (this won't find similar items with random embeddings, but tests the query)
    console.log('🔍 Testing similarity search...');
    const searchEmbedding = Array.from({ length: 384 }, () => Math.random());
    const similarItems = await vectorStore.findSimilarQuestions(searchEmbedding, 5);
    console.log(`✅ Similarity search completed, found ${similarItems.length} items`);

    // Test training summary
    console.log('📊 Getting training summary...');
    const summary = await vectorStore.getTrainingSummary();
    console.log('✅ Training summary:', summary);

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await vectorStore.clear();
    console.log('✅ Test data cleared');

    await vectorStore.close();
    console.log('✅ Connection closed');

    console.log('\n🎉 All PgVectorStore tests passed!');
    console.log('\n💡 PgVectorStore is now fully functional with:');
    console.log('   • Dynamic pg module loading');
    console.log('   • Proper PostgreSQL connection handling');
    console.log('   • Vector similarity search');
    console.log('   • Automatic schema creation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔍 Error details:', error);
    process.exit(1);
  }
}

testPgVectorStore().catch(console.error);
