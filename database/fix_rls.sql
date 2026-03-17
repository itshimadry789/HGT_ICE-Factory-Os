-- Quick Fix: Enable Public Access for Testing
-- Run this in Supabase SQL Editor if you can't insert records

-- Option 1: Disable RLS temporarily (for testing only)
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Option 2: Or create permissive policies (better for production)
-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON sales
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON expenses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON fuel_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON production_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Allow anonymous access (for testing - remove in production!)
CREATE POLICY "Allow anonymous access" ON sales
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access" ON expenses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access" ON fuel_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access" ON production_logs
  FOR ALL USING (true) WITH CHECK (true);

