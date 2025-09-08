# Test Environment Configuration

## Database Configuration
- **Database**: izumi_test
- **Username**: postgres
- **Password**: password123
- **Host**: localhost
- **Port**: 5432
- **Schema**: test_data (for sample data), izumi (for vector store)

## Test Data Overview

The test database contains an e-commerce scenario with the following tables:

### Core Tables
- **users**: Customer information (10 sample users)
- **categories**: Product categories (hierarchical structure)
- **products**: Product catalog (10 sample products)
- **orders**: Customer orders (10 sample orders)
- **order_items**: Individual items in orders
- **reviews**: Product reviews from customers
- **inventory_transactions**: Stock movement tracking

### Sample Data Highlights
- Users from different demographics
- Products across Electronics, Clothing, Books, and Home & Garden
- Orders in various states (pending, processing, shipped, delivered, cancelled)
- Realistic pricing and inventory tracking
- Customer reviews with ratings

## Common Test Queries

Here are some natural language questions you can test with Izumi:

1. "How many users are registered?"
2. "What are the top-selling products?"
3. "Show me all orders from last month"
4. "Which products have the highest ratings?"
5. "What's the total revenue for delivered orders?"
6. "Find customers who haven't placed any orders"
7. "Show me all products that are out of stock"
8. "What's the average order value?"
9. "Which category has the most products?"
10. "Show me all cancelled orders with customer details"

## Environment Variables

Create a `.env` file with:
```
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=postgresql://postgres:password123@localhost:5432/izumi_test
```
