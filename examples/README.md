# Izumi Examples

This directory contains examples of how to use the Izumi text-to-SQL library.

## Examples

- [`basic-usage.ts`](./basic-usage.ts) - Basic text-to-SQL conversion
- [`drizzle-integration.ts`](./drizzle-integration.ts) - Using with Drizzle ORM
- [`multiple-providers.ts`](./multiple-providers.ts) - Working with different LLM providers
- [`schema-management.ts`](./schema-management.ts) - Schema parsing and export
- [`advanced-features.ts`](./advanced-features.ts) - Query optimization and explanation

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
npm run dev examples/basic-usage.ts
```
