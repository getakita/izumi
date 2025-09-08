#!/usr/bin/env node

/**
 * Test environment variable loading
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
console.log('📍 Current directory:', __dirname);
const envResult = dotenv.config({ path: join(__dirname, '.env') });

console.log('🔧 dotenv config result:', envResult.error ? envResult.error : 'Success');

console.log('🔑 Environment variables:');
console.log('   OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);
console.log('   OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));
console.log('   OPENAI_API_KEY ends with:', process.env.OPENAI_API_KEY?.substring(-10));
console.log('   DATABASE_URL:', process.env.DATABASE_URL);

// Test if the key format looks correct
if (process.env.OPENAI_API_KEY) {
  const key = process.env.OPENAI_API_KEY;
  if (key.startsWith('sk-')) {
    console.log('✅ API key format looks correct (starts with sk-)');
    if (key.length > 50) {
      console.log('✅ API key length looks correct (>50 chars)');
    } else {
      console.log('⚠️  API key might be too short:', key.length, 'chars');
    }
  } else {
    console.log('❌ API key does not start with sk-');
  }
} else {
  console.log('❌ OPENAI_API_KEY not found');
}

// Check for any other env files that might be interfering
import { existsSync } from 'fs';

const possibleEnvFiles = [
  '.env',
  '.env.local', 
  '.env.development',
  '../.env'
];

console.log('\n📁 Checking for other .env files:');
for (const file of possibleEnvFiles) {
  if (existsSync(file)) {
    console.log(`   ✅ Found: ${file}`);
  } else {
    console.log(`   ❌ Not found: ${file}`);
  }
}
