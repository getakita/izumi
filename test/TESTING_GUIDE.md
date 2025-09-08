# 🧪 Izumi Testing Guide

This guide walks you through testing the Izumi framework with a real PostgreSQL database and sample e-commerce data.

## Quick Start

1. **Set up the test environment:**
   ```powershell
   # From the root project directory
   npm run test:setup
   ```

2. **Add your OpenAI API key to `test/.env`:**
   ```
   OPENAI_API_KEY=your-actual-openai-api-key-here
   ```

3. **Test the database connection:**
   ```powershell
   npm run test:db
   ```

4. **Run basic Izumi tests:**
   ```powershell
   npm run test:basic
   ```

5. **Try interactive query generation:**
   ```powershell
   npm run test:interactive
   ```

## What's Included

### 🐘 PostgreSQL Database
- **Container**: `izumi-postgres-test`
- **Database**: `izumi_test`
- **Extension**: pgvector for vector similarity search
- **Port**: 5432 (localhost)

### 📊 Sample Data Schema
The test database includes a realistic e-commerce scenario:

- **users** (10 customers)
- **categories** (hierarchical product categories)
- **products** (10 sample products across different categories)
- **orders** (10 orders in various states)
- **order_items** (order line items)
- **reviews** (customer product reviews)
- **inventory_transactions** (stock movements)

### 🧪 Test Scripts

#### `db-test.js`
Tests database connectivity and shows sample data:
```powershell
npm run test:db
```

#### `basic-test.js`
Comprehensive test that:
- Creates an Izumi instance
- Trains with DDL schema
- Trains with question-SQL pairs
- Trains with documentation
- Tests query generation (if API key is provided)

```powershell
npm run test:basic
```

#### `run-queries.js`
Interactive shell for testing natural language queries:
```powershell
npm run test:interactive
```

## Sample Questions to Test

Try these natural language questions in the interactive mode:

### Basic Queries
- "How many users are registered?"
- "What are the top 5 most expensive products?"
- "Show me all categories"

### Analytical Queries
- "What's the total revenue from delivered orders?"
- "Which products have the highest average ratings?"
- "Show me customers who have never placed an order"

### Complex Joins
- "Show me all orders with customer names and product details"
- "Which category has generated the most revenue?"
- "Find products that have been reviewed but never sold"

### Business Intelligence
- "What's the average order value by customer?"
- "Show me monthly revenue trends"
- "Which products are out of stock?"

## Database Management

### Start/Stop Database
```powershell
# Start database
cd test
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres
```

### Connect Directly
```powershell
# Using psql (if installed)
psql postgresql://postgres:password123@localhost:5432/izumi_test

# Or using Docker
docker-compose exec postgres psql -U postgres -d izumi_test
```

### Sample Queries to Run Directly
```sql
-- Check table sizes
SELECT schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates, n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'test_data';

-- View sample data
SELECT u.first_name, u.last_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
FROM test_data.users u
LEFT JOIN test_data.orders o ON u.id = o.user_id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY total_spent DESC NULLS LAST;
```

## Troubleshooting

### Database Issues
- **Connection refused**: Make sure Docker is running and database is started
- **Port conflicts**: Check if port 5432 is already in use
- **Health checks**: Use `docker-compose ps` to check container status

### API Issues
- **Invalid API key**: Make sure your OpenAI key is correctly set in `.env`
- **Rate limits**: OpenAI has rate limits; wait a moment between requests
- **Model access**: Ensure you have access to the specified model (gpt-4o-mini)

### Common Errors
```powershell
# If you get module not found errors
cd test
npm install

# If Docker isn't starting
docker system prune
docker-compose down
docker-compose up -d

# Check Docker status
docker ps
docker-compose logs postgres
```

## Environment Variables

Create `test/.env` with these variables:

```env
# Required for query generation
OPENAI_API_KEY=your-openai-api-key-here

# Database connection (pre-configured)
DATABASE_URL=postgresql://postgres:password123@localhost:5432/izumi_test

# Optional: Other LLM providers
# ANTHROPIC_API_KEY=your-anthropic-key
# GOOGLE_AI_API_KEY=your-google-key
```

## File Structure

```
test/
├── docker-compose.yml          # PostgreSQL setup
├── package.json                # Test dependencies
├── setup.js                    # Automated setup script
├── setup.ps1                   # PowerShell setup script
├── db-test.js                  # Database connection test
├── basic-test.js               # Basic Izumi functionality test
├── run-queries.js              # Interactive query runner
├── .env.example                # Environment template
├── .env                        # Your environment variables
├── README.md                   # This file
└── sql/
    └── init/
        ├── 01-init-extensions.sql    # Enable pgvector
        ├── 02-create-tables.sql      # Create schema
        └── 03-insert-sample-data.sql # Insert test data
```

## Next Steps

1. **Experiment with different question types**
2. **Try different LLM providers** (add API keys to .env)
3. **Test with your own schema** (modify the DDL in basic-test.js)
4. **Explore pgvector integration** (see examples/pgvector-example.ts)

## Getting Help

If you encounter issues:

1. Check Docker is running: `docker ps`
2. Verify database health: `npm run test:db`
3. Check logs: `cd test && docker-compose logs postgres`
4. Reset everything: `cd test && docker-compose down && docker-compose up -d`

Happy testing! 🚀
