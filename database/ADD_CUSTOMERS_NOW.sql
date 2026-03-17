-- ============================================
-- ADD CUSTOMERS TO SUPABASE - RUN THIS NOW!
-- ============================================
-- Copy this entire file and run it in Supabase SQL Editor

-- Step 1: Make sure customers table exists (if you haven't run the full schema)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    total_credit_due DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 10000000,
    last_payment_date TIMESTAMPTZ,
    days_overdue INTEGER DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'LOW',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add sample customers
INSERT INTO customers (name, phone_number, total_credit_due, credit_limit, is_active) VALUES
('Abdullahi Ali', '+211 912 345 678', 125000, 10000000, true),
('Hassan Mahmoud', '+211 922 111 222', 450000, 10000000, true),
('Zahra Farah', '+211 955 888 777', 0, 10000000, true),
('Mustafa Osman', '+211 911 000 999', 85000, 10000000, true),
('Walk-in Customer', 'N/A', 0, 10000000, true)
ON CONFLICT DO NOTHING;

-- Step 3: Fix RLS (Row Level Security) - Allow access
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow anonymous access" ON customers;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON customers;

-- Create permissive policy
CREATE POLICY "Allow anonymous access" ON customers
  FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Verify customers were added
SELECT id, name, phone_number, total_credit_due FROM customers ORDER BY name;

