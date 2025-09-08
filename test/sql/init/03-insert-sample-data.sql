-- Insert sample data for testing
SET search_path TO test_data, public;

-- Insert categories
INSERT INTO categories (name, description, parent_id) VALUES
('Electronics', 'Electronic devices and accessories', NULL),
('Smartphones', 'Mobile phones and accessories', 1),
('Laptops', 'Portable computers', 1),
('Clothing', 'Apparel and fashion items', NULL),
('Men''s Clothing', 'Clothing for men', 4),
('Women''s Clothing', 'Clothing for women', 4),
('Books', 'Physical and digital books', NULL),
('Fiction', 'Fiction books', 7),
('Non-Fiction', 'Non-fiction books', 7),
('Home & Garden', 'Home improvement and garden supplies', NULL);

-- Insert users
INSERT INTO users (first_name, last_name, email, phone, date_of_birth) VALUES
('John', 'Doe', 'john.doe@email.com', '+1-555-0101', '1985-03-15'),
('Jane', 'Smith', 'jane.smith@email.com', '+1-555-0102', '1990-07-22'),
('Mike', 'Johnson', 'mike.johnson@email.com', '+1-555-0103', '1988-11-08'),
('Sarah', 'Williams', 'sarah.williams@email.com', '+1-555-0104', '1992-01-30'),
('David', 'Brown', 'david.brown@email.com', '+1-555-0105', '1987-09-12'),
('Emily', 'Davis', 'emily.davis@email.com', '+1-555-0106', '1991-05-18'),
('Chris', 'Miller', 'chris.miller@email.com', '+1-555-0107', '1989-12-03'),
('Lisa', 'Wilson', 'lisa.wilson@email.com', '+1-555-0108', '1986-08-27'),
('Tom', 'Moore', 'tom.moore@email.com', '+1-555-0109', '1993-04-14'),
('Amy', 'Taylor', 'amy.taylor@email.com', '+1-555-0110', '1990-10-09');

-- Insert products
INSERT INTO products (name, description, price, cost, sku, category_id, stock_quantity, weight, dimensions) VALUES
('iPhone 15 Pro', 'Latest Apple smartphone with advanced camera system', 999.99, 600.00, 'IPHONE15P-128', 2, 50, 0.221, '6.1 x 2.8 x 0.32 inches'),
('Samsung Galaxy S24', 'Flagship Android smartphone with AI features', 849.99, 500.00, 'GALAXY-S24-256', 2, 75, 0.213, '5.9 x 2.7 x 0.30 inches'),
('MacBook Pro 14"', 'Professional laptop with M3 chip', 1999.99, 1200.00, 'MBP14-M3-512', 3, 25, 1.55, '12.3 x 8.7 x 0.61 inches'),
('Dell XPS 13', 'Ultrabook with Intel processor', 1299.99, 800.00, 'XPS13-I7-512', 3, 30, 1.27, '11.6 x 7.8 x 0.58 inches'),
('Men''s Casual Shirt', 'Cotton blend casual shirt', 49.99, 20.00, 'MSHIRT-BL-L', 5, 100, 0.3, 'Large'),
('Women''s Summer Dress', 'Floral print summer dress', 79.99, 35.00, 'WDRESS-FL-M', 6, 75, 0.4, 'Medium'),
('The Great Gatsby', 'Classic American novel by F. Scott Fitzgerald', 12.99, 5.00, 'BOOK-GATSBY', 8, 200, 0.2, '8 x 5.2 x 0.7 inches'),
('Atomic Habits', 'Self-help book about building good habits', 16.99, 7.00, 'BOOK-ATOMIC', 9, 150, 0.3, '8.4 x 5.5 x 0.9 inches'),
('Coffee Maker', 'Automatic drip coffee maker', 89.99, 40.00, 'COFFEE-AUTO-12', 10, 40, 2.5, '14 x 10 x 12 inches'),
('Garden Hose', '50ft expandable garden hose', 34.99, 15.00, 'HOSE-EXP-50', 10, 80, 1.8, '50 feet');

-- Insert orders
INSERT INTO orders (user_id, order_number, status, total_amount, tax_amount, shipping_amount, payment_method, shipping_address, order_date) VALUES
(1, 'ORD-001', 'delivered', 1049.98, 84.00, 9.99, 'credit_card', '123 Main St, Anytown, ST 12345', '2024-01-15 10:30:00'),
(2, 'ORD-002', 'delivered', 929.98, 74.40, 0.00, 'paypal', '456 Oak Ave, Another City, ST 67890', '2024-01-18 14:20:00'),
(3, 'ORD-003', 'shipped', 1379.98, 110.40, 15.99, 'credit_card', '789 Pine St, Third Town, ST 13579', '2024-02-02 09:15:00'),
(4, 'ORD-004', 'processing', 129.98, 10.40, 7.99, 'debit_card', '321 Elm Dr, Fourth City, ST 24680', '2024-02-05 16:45:00'),
(5, 'ORD-005', 'delivered', 89.99, 7.20, 5.99, 'credit_card', '654 Maple Ln, Fifth Village, ST 97531', '2024-02-10 11:20:00'),
(6, 'ORD-006', 'cancelled', 79.99, 6.40, 4.99, 'paypal', '987 Cedar Rd, Sixth Borough, ST 86420', '2024-02-12 13:10:00'),
(7, 'ORD-007', 'delivered', 62.98, 5.04, 3.99, 'credit_card', '147 Birch Blvd, Seventh District, ST 75319', '2024-02-15 08:30:00'),
(8, 'ORD-008', 'delivered', 16.99, 1.36, 2.99, 'debit_card', '258 Spruce Way, Eighth Quarter, ST 64208', '2024-02-18 12:00:00'),
(9, 'ORD-009', 'processing', 34.99, 2.80, 1.99, 'credit_card', '369 Willow St, Ninth Sector, ST 53197', '2024-02-20 15:30:00'),
(10, 'ORD-010', 'delivered', 1999.99, 160.00, 0.00, 'paypal', '741 Aspen Ave, Tenth Zone, ST 42086', '2024-02-22 10:45:00');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 999.99, 999.99),
(1, 5, 1, 49.99, 49.99),
(2, 2, 1, 849.99, 849.99),
(2, 9, 1, 89.99, 89.99),
(3, 3, 1, 1999.99, 1999.99),
(3, 4, 1, 1299.99, 1299.99),
(4, 6, 1, 79.99, 79.99),
(4, 5, 1, 49.99, 49.99),
(5, 9, 1, 89.99, 89.99),
(6, 6, 1, 79.99, 79.99),
(7, 7, 2, 12.99, 25.98),
(7, 8, 2, 16.99, 33.98),
(8, 8, 1, 16.99, 16.99),
(9, 10, 1, 34.99, 34.99),
(10, 3, 1, 1999.99, 1999.99);

-- Insert reviews
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
(1, 1, 5, 'Amazing phone!', 'The camera quality is incredible and the performance is smooth.', true),
(2, 2, 4, 'Great Android phone', 'Love the AI features, but battery could be better.', true),
(3, 3, 5, 'Perfect for work', 'The M3 chip handles everything I throw at it. Highly recommended!', true),
(4, 3, 4, 'Good ultrabook', 'Nice design and performance, but gets warm under heavy load.', false),
(5, 1, 3, 'Decent shirt', 'Good quality cotton but sizing runs small.', true),
(6, 4, 5, 'Beautiful dress', 'Perfect fit and the floral pattern is gorgeous!', true),
(7, 7, 5, 'Timeless classic', 'Still relevant after all these years. A must-read!', true),
(8, 7, 5, 'Life-changing book', 'Has helped me build better habits. Highly practical advice.', true),
(8, 8, 4, 'Very helpful', 'Good strategies for habit formation, though some parts are repetitive.', true),
(9, 2, 4, 'Good coffee maker', 'Makes decent coffee but could be faster.', true);

-- Insert inventory transactions
INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_type, reference_id, notes) VALUES
(1, 'in', 100, 'purchase', NULL, 'Initial stock'),
(1, 'out', 1, 'order', 1, 'Order ORD-001'),
(2, 'in', 100, 'purchase', NULL, 'Initial stock'),
(2, 'out', 1, 'order', 2, 'Order ORD-002'),
(3, 'in', 50, 'purchase', NULL, 'Initial stock'),
(3, 'out', 2, 'order', NULL, 'Orders ORD-003 and ORD-010'),
(4, 'in', 50, 'purchase', NULL, 'Initial stock'),
(4, 'out', 1, 'order', 3, 'Order ORD-003'),
(5, 'in', 150, 'purchase', NULL, 'Initial stock'),
(5, 'out', 2, 'order', NULL, 'Orders ORD-001 and ORD-004'),
(6, 'in', 100, 'purchase', NULL, 'Initial stock'),
(6, 'out', 1, 'order', 4, 'Order ORD-004'),
(7, 'in', 250, 'purchase', NULL, 'Initial stock'),
(7, 'out', 2, 'order', 7, 'Order ORD-007'),
(8, 'in', 200, 'purchase', NULL, 'Initial stock'),
(8, 'out', 3, 'order', NULL, 'Orders ORD-007 and ORD-008'),
(9, 'in', 60, 'purchase', NULL, 'Initial stock'),
(9, 'out', 2, 'order', NULL, 'Orders ORD-002 and ORD-005'),
(10, 'in', 100, 'purchase', NULL, 'Initial stock'),
(10, 'out', 1, 'order', 9, 'Order ORD-009');
