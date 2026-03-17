-- Add Sample Customers to Supabase
-- Run this in Supabase SQL Editor to create customers with proper UUIDs

-- First, delete any existing mock customers (optional)
-- DELETE FROM customers WHERE id IN ('c1', 'c2', 'c3', 'c4', 'c5');

-- Insert sample customers with UUIDs
INSERT INTO customers (name, phone_number, total_credit_due, credit_limit, is_active) VALUES
('Abdullahi Ali', '+211 912 345 678', 125000, 10000000, true),
('Hassan Mahmoud', '+211 922 111 222', 450000, 10000000, true),
('Zahra Farah', '+211 955 888 777', 0, 10000000, true),
('Mustafa Osman', '+211 911 000 999', 85000, 10000000, true),
('Walk-in Customer', 'N/A', 0, 10000000, true)
ON CONFLICT DO NOTHING;

-- Verify customers were created
SELECT id, name, phone_number, total_credit_due FROM customers ORDER BY name;

