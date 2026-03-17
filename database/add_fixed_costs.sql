-- ============================================
-- HGT ICE FACTORY OS - FIXED COSTS ADDITION
-- ============================================
-- Run this in Supabase SQL Editor.
-- Adds a fixed_costs table for Salary/Utilities/etc.

CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('SALARY', 'UTILITIES', 'RENT', 'SECURITY', 'OTHER')),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) DEFAULT 'SSP',
  vendor VARCHAR(255),
  receipt_number VARCHAR(100),
  approved_by VARCHAR(255),
  notes TEXT,
  cost_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixed_costs_category ON fixed_costs(category);
CREATE INDEX IF NOT EXISTS idx_fixed_costs_date ON fixed_costs(cost_date DESC);

-- Optional: enable RLS (matches project style)
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (adjust to roles later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fixed_costs' AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON fixed_costs FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow service role (backend API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fixed_costs' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access" ON fixed_costs FOR ALL USING (auth.jwt()->>'role' = 'service_role');
  END IF;
END $$;

