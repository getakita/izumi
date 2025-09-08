# Izumi

| GitHub | NPM | Documentation | License |
| ------ | --- | ------------- | ------- |
| [![GitHub](https://img.shields.io/badge/GitHub-izumi-blue?logo=github)](https://github.com/getakita/izumi) | [![NPM](https://img.shields.io/npm/v/izumi?logo=npm)](https://www.npmjs.com/package/izumi) | [![Documentation](https://img.shields.io/badge/Documentation-izumi-blue?logo=read-the-docs)](https://izumi.dev/docs/) | [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) |

Izumi is an Apache-licensed open-source TypeScript RAG (Retrieval-Augmented Generation) framework for SQL generation with support for multiple LLM providers and Drizzle ORM integration.



## How Izumi works

Izumi works in two easy steps - train a RAG "model" on your data, and then ask questions which will return SQL queries that can be set up to automatically run on your database.

1. **Train a RAG "model" on your data**.
2. **Ask questions**.

If you don't know what RAG is, don't worry -- you don't need to know how this works under the hood to use it. You just need to know that you "train" a model, which stores some metadata and then use it to "ask" questions.


## User Interfaces
These are some of the user interfaces that can be built using Izumi:

- [Node.js/Express Apps](examples/)
- [Next.js Applications](examples/) (comming soon)


## Supported LLMs

- [OpenAI](https://openai.com/) (GPT-4, GPT-3.5-turbo, etc.)
- [Anthropic](https://anthropic.com/) (Claude 3.5 Sonnet, Claude 3 Haiku, etc.)
- [Google](https://ai.google.dev/) (Gemini 1.5 Pro, Gemini 1.5 Flash, etc.)
- [Mistral](https://mistral.ai/) (Mistral Large, Mistral Medium, etc.)
- [Cohere](https://cohere.ai/) (Command R+, Command R, etc.)

All LLM integrations are powered by the [Vercel AI SDK](https://sdk.vercel.ai/) for unified provider support.

## Supported Vector Stores

- [Memory Vector Store](src/vector/MemoryVectorStore.ts) (Built-in, no setup required)
- [PostgreSQL pgvector](src/vector/PgVectorStore.ts) (Production-ready vector similarity search)
- ChromaDB (Coming soon)
- Pinecone (Coming soon)
- Weaviate (Coming soon)
- Qdrant (Coming soon)

## Supported Output Formats

- **Raw SQL** - Standard SQL queries
- **Drizzle ORM** - Type-safe Drizzle query syntax
- **Schema Export** - JSON, TypeScript interfaces, Drizzle schema definitions

## Quick Start

Get started with Izumi in just 3 lines of code:

```typescript
import { createOpenAIWithDatabase } from 'izumi';

const izumi = createOpenAIWithDatabase('your-openai-api-key', {
  type: 'postgresql',
  runSQL: async (sql) => {
    // Your database connection logic here
    return db.query(sql);
  }
});

// Ask questions immediately!
const result = await izumi.ask('How many users do we have?');
console.log(result.sql);
```

That's it! Izumi automatically:
- ✅ Extracts your database schema
- ✅ Generates training data using AI
- ✅ Trains itself on relevant question-SQL pairs
- ✅ Becomes ready to answer questions

## How It Works

1. **Connect**: Provide your LLM API key and database connection
2. **Auto-Initialize**: Izumi automatically extracts schema and generates training data
3. **Ask Questions**: Start asking questions in natural language
4. **Get SQL**: Receive optimized SQL queries with explanations

## Supported Databases

- **PostgreSQL** - Full schema extraction from `information_schema`
- **MySQL** - Schema extraction from `information_schema`
- **SQLite** - Schema extraction from `sqlite_master`
- **MSSQL** - Coming soon

## Database Connection Examples

### PostgreSQL
```typescript
import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'myuser',
  password: 'mypass'
});

await client.connect();

const dbConnection = {
  type: 'postgresql',
  runSQL: async (sql) => await client.query(sql)
};
```

### MySQL
```typescript
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'myuser',
  password: 'mypass',
  database: 'mydb'
});

const dbConnection = {
  type: 'mysql',
  runSQL: async (sql) => await connection.execute(sql)
};
```

### SQLite
```typescript
import Database from 'better-sqlite3';

const db = new Database('mydb.sqlite');

const dbConnection = {
  type: 'sqlite',
  runSQL: async (sql) => db.prepare(sql).all()
};
```
## RAG vs. Fine-Tuning
**RAG (What Izumi uses)**
- Portable across LLMs
- Easy to remove training data if any of it becomes obsolete
- Much cheaper to run than fine-tuning
- More future-proof -- if a better LLM comes out, you can just swap it out

**Fine-Tuning**
- Good if you need to minimize tokens in the prompt
- Slow to get started
- Expensive to train and run (generally)

## Why Izumi?

1. **TypeScript-first with full type safety.**
   - Built for modern TypeScript/JavaScript applications
   - Full type safety with Drizzle ORM integration
   - Excellent IDE support with IntelliSense

2. **Multiple LLM providers with easy switching.**
   - Start with one provider, switch to another without code changes
   - Unified API across all supported LLM providers
   - Built on the battle-tested Vercel AI SDK

3. **Drizzle ORM integration.**
   - Generate type-safe Drizzle queries, not just raw SQL
   - Export schema definitions in Drizzle format
   - Seamless integration with existing Drizzle projects

4. **Secure and private.**
   - Your database contents are never sent to the LLM or vector database
   - SQL execution happens in your local environment
   - Training data stays within your infrastructure

5. **Self learning.**
   - Automatically improve accuracy with successful query examples
   - Easy feedback integration for continuous improvement
   - Correct question-to-SQL pairs are stored for future reference

6. **Flexible deployment.**
   - Works in Node.js, browsers, serverless functions
   - Easy integration with existing applications
   - Multiple output formats (SQL, Drizzle, explanations)

## Extending Izumi
Izumi is designed to connect to any LLM provider and vector database. There's an [IzumiBase](src/base/IzumiBase.ts) abstract base class that defines the core functionality. The package provides implementations for use with multiple LLM providers via the Vercel AI SDK and includes a memory-based vector store. You can easily extend Izumi to use your own LLM or vector database implementations.

## Examples

### Basic Usage
```typescript
import { createOpenAIIzumi } from 'izumi';

const izumi = createOpenAIIzumi('your-api-key');

// Train with schema
await izumi.train({
  ddl: `CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100))`
});

// Ask questions
const result = await izumi.ask('Get all users created today');
console.log(result.sql);
```

### Advanced Configuration
```typescript
import { Izumi } from 'izumi';

const izumi = new Izumi({
  llm: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022'
  },
  vectorStore: {
    similarityThreshold: 0.8
  }
});
```

## 🧪 Testing & Development

Izumi includes a comprehensive test environment with a real PostgreSQL database and sample e-commerce data for testing and development.

### Quick Test Setup
```powershell
# Set up test environment with Docker
npm run test:setup

# Test database connectivity  
npm run test:db

# Run sample SQL queries
npm run test:queries

# Test Izumi with natural language (requires OpenAI API key)
npm run test:basic

# Interactive query testing
npm run test:interactive
```

### Test Database
The test environment includes:
- **PostgreSQL 16** with **pgvector** extension
- **E-commerce sample data**: 10 users, 10 products, 10 orders, reviews, inventory
- **Realistic scenarios**: Multi-table joins, aggregations, complex business logic
- **Docker setup**: Complete containerized environment

### Sample Questions
Try asking Izumi these natural language questions:
- "How many users are registered?"
- "What are our best-selling products?"
- "Show me customers who haven't ordered anything"
- "Which products have the highest ratings?"
- "What's the total revenue from delivered orders?"

For detailed testing instructions, see [`test/TESTING_GUIDE.md`](test/TESTING_GUIDE.md).

## License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## More resources
- [Full Documentation](https://izumi.dev/docs/) (Coming soon)
- [GitHub Repository](https://github.com/getakita/izumi)
- [NPM Package](https://www.npmjs.com/package/izumi)

