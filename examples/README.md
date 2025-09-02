# Izumi Examples

This directory contains examples of how to use the Izumi text-to-SQL library with **automatic training**.

## ✨ What's New

Izumi now automatically generates training data from your database schema! No more manual training required.

## Examples

- [`basic-usage.ts`](./basic-usage.ts) - Basic usage with auto-initialization
- [`simple-example.ts`](./simple-example.ts) - Simplest possible usage (3 lines!)
- [`vanna-pattern-demo.ts`](./vanna-pattern-demo.ts) - Complete Vanna.AI pattern demo
- [`schema-inference-example.js`](./schema-inference-example.js) - Schema inference demo
- [`pgvector-example.js`](./pgvector-example.js) - PostgreSQL with pgvector

## Quick Start (3 Lines!)

```typescript
import { createOpenAIWithDatabase } from 'izumi';

const izumi = createOpenAIWithDatabase('your-api-key', dbConnection);
// Auto-initialization happens automatically!

const result = await izumi.ask('How many users do we have?');
```

## Running Examples

1. Install dependencies:
```bash
npm install
```

2. Set your API keys:
```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
```

3. Run an example:
```bash
npx tsx examples/simple-example.ts
```

## Database Setup

### PostgreSQL
```typescript
const dbConnection = {
  type: 'postgresql',
  runSQL: async (sql) => await client.query(sql)
};
```

### MySQL
```typescript
const dbConnection = {
  type: 'mysql',
  runSQL: async (sql) => await connection.execute(sql)
};
```

### SQLite
```typescript
const dbConnection = {
  type: 'sqlite',
  runSQL: async (sql) => db.prepare(sql).all()
};
```

## Key Features Demonstrated

- ✅ **Auto-Training**: No manual training required
- ✅ **Schema Inference**: Automatically learns from your database
- ✅ **Multiple Providers**: OpenAI, Anthropic, Google, Mistral, Cohere
- ✅ **Vector Stores**: Memory, PostgreSQL pgvector
- ✅ **Schema Export**: JSON, TypeScript, Drizzle formats
