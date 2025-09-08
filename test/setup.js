#!/usr/bin/env node

/**
 * Setup script for Izumi test environment
 * This script helps users set up the test environment step by step
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, copyFileSync } from 'fs';
import { createInterface } from 'readline';

const execAsync = promisify(exec);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkDocker() {
  try {
    await execAsync('docker --version');
    console.log('✅ Docker is installed');
    
    const { stdout } = await execAsync('docker ps');
    console.log('✅ Docker is running');
    return true;
  } catch (error) {
    console.log('❌ Docker is not available:', error.message);
    return false;
  }
}

async function checkDockerCompose() {
  try {
    await execAsync('docker-compose --version');
    console.log('✅ Docker Compose is available');
    return true;
  } catch (error) {
    try {
      await execAsync('docker compose version');
      console.log('✅ Docker Compose (v2) is available');
      return true;
    } catch (error2) {
      console.log('❌ Docker Compose is not available');
      return false;
    }
  }
}

async function setupEnvironment() {
  console.log('\n🔧 Setting up environment variables...');
  
  if (!existsSync('.env')) {
    copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file from template');
    
    const setupEnv = await askQuestion('Would you like to configure your OpenAI API key now? (y/n): ');
    if (setupEnv.toLowerCase() === 'y' || setupEnv.toLowerCase() === 'yes') {
      const apiKey = await askQuestion('Enter your OpenAI API key: ');
      if (apiKey.trim()) {
        try {
          const fs = await import('fs/promises');
          let envContent = await fs.readFile('.env', 'utf8');
          envContent = envContent.replace('your-openai-api-key-here', apiKey.trim());
          await fs.writeFile('.env', envContent);
          console.log('✅ OpenAI API key configured');
        } catch (error) {
          console.log('⚠️  Could not update .env file. Please edit it manually.');
        }
      }
    }
  } else {
    console.log('✅ .env file already exists');
  }
}

async function startDatabase() {
  console.log('\n🐘 Starting PostgreSQL database...');
  
  try {
    // Try docker-compose first, then docker compose
    let composeCommand = 'docker-compose';
    try {
      await execAsync('docker-compose --version');
    } catch {
      composeCommand = 'docker compose';
    }

    console.log('📥 Pulling PostgreSQL image (this may take a few minutes on first run)...');
    await execAsync(`${composeCommand} pull`);
    
    console.log('🚀 Starting database container...');
    await execAsync(`${composeCommand} up -d`);
    
    console.log('⏳ Waiting for database to be ready...');
    let retries = 30;
    while (retries > 0) {
      try {
        await execAsync(`${composeCommand} exec postgres pg_isready -U postgres -d izumi_test`);
        console.log('✅ Database is ready!');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('Database failed to start within expected time');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        process.stdout.write('.');
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to start database:', error.message);
    return false;
  }
  
  return true;
}

async function installDependencies() {
  console.log('\n📦 Installing test dependencies...');
  
  try {
    await execAsync('npm install');
    console.log('✅ Dependencies installed');
    return true;
  } catch (error) {
    console.log('❌ Failed to install dependencies:', error.message);
    console.log('💡 Please run: npm install');
    return false;
  }
}

async function testSetup() {
  console.log('\n🧪 Testing the setup...');
  
  try {
    const { stdout } = await execAsync('node db-test.js');
    console.log(stdout);
    return true;
  } catch (error) {
    console.log('❌ Setup test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Izumi Test Environment Setup');
  console.log('================================\n');

  // Check prerequisites
  console.log('🔍 Checking prerequisites...');
  
  const dockerOk = await checkDocker();
  const composeOk = await checkDockerCompose();
  
  if (!dockerOk || !composeOk) {
    console.log('\n❌ Prerequisites not met. Please install Docker and Docker Compose first.');
    console.log('📖 Visit: https://docs.docker.com/get-docker/');
    process.exit(1);
  }

  // Setup steps
  await setupEnvironment();
  
  const shouldInstall = await askQuestion('\nInstall Node.js dependencies? (y/n): ');
  if (shouldInstall.toLowerCase() === 'y' || shouldInstall.toLowerCase() === 'yes') {
    await installDependencies();
  }
  
  const shouldStartDB = await askQuestion('\nStart PostgreSQL database? (y/n): ');
  if (shouldStartDB.toLowerCase() === 'y' || shouldStartDB.toLowerCase() === 'yes') {
    const dbStarted = await startDatabase();
    
    if (dbStarted) {
      const shouldTest = await askQuestion('\nTest database connection? (y/n): ');
      if (shouldTest.toLowerCase() === 'y' || shouldTest.toLowerCase() === 'yes') {
        await testSetup();
      }
    }
  }

  console.log('\n🎉 Setup Complete!');
  console.log('\n📋 What you can do now:');
  console.log('   • Test database: npm run test-db');
  console.log('   • Run basic test: npm run basic-test');
  console.log('   • Interactive queries: npm run interactive');
  console.log('   • View logs: npm run logs');
  console.log('   • Stop database: npm run stop-db');
  
  console.log('\n💡 Make sure to add your OpenAI API key to the .env file!');
  
  rl.close();
}

main().catch(console.error);
