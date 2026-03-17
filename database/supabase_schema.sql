-- ============================================
-- HANAANO ICE FACTORY - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in Supabase SQL Editor to set up your database

-- ============================================
-- 1. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    total_credit_due DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 10000000, -- 10M SSP default limit
    last_payment_date TIMESTAMPTZ,
    days_overdue INTEGER DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_credit ON customers(total_credit_due DESC);
CREATE INDEX idx_customers_risk ON customers(risk_level);

-- ============================================
-- 2. SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    quantity_blocks INTEGER NOT NULL CHECK (quantity_blocks > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('CASH', 'CREDIT', 'PARTIAL')),
    amount_paid DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    sold_by VARCHAR(255), -- Staff member who made the sale
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(created_at DESC);
CREATE INDEX idx_sales_status ON sales(payment_status);

-- ============================================
-- 3. PAYMENTS TABLE (Track credit payments)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH', -- CASH, BANK_TRANSFER, MOBILE_MONEY
    reference_number VARCHAR(100),
    notes TEXT,
    received_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(created_at DESC);

-- ============================================
-- 4. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('FUEL', 'FOOD', 'SALARY', 'MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'OTHER')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SSP',
    vendor VARCHAR(255),
    receipt_number VARCHAR(100),
    approved_by VARCHAR(255),
    notes TEXT,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);

-- ============================================
-- 5. FUEL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liters_added DECIMAL(10,2) NOT NULL,
    cost_per_liter DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    generator_hours_run DECIMAL(6,2),
    boxes_produced INTEGER DEFAULT 0,
    fuel_efficiency DECIMAL(6,3), -- Liters per block
    efficiency_variance DECIMAL(6,2), -- Percentage variance from normal
    alert_level VARCHAR(20) DEFAULT 'NORMAL', -- NORMAL, WARNING, CRITICAL
    supplier VARCHAR(255),
    notes TEXT,
    logged_by VARCHAR(255),
    fuel_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fuel_date ON fuel_logs(fuel_date DESC);
CREATE INDEX idx_fuel_alert ON fuel_logs(alert_level);

-- ============================================
-- 6. PRODUCTION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantity_produced INTEGER NOT NULL,
    waste_blocks INTEGER DEFAULT 0,
    good_blocks INTEGER GENERATED ALWAYS AS (quantity_produced - waste_blocks) STORED,
    waste_percentage DECIMAL(5,2),
    shift VARCHAR(20) CHECK (shift IN ('Morning', 'Afternoon', 'Night')),
    runtime_hours DECIMAL(6,2),
    machine_issues TEXT,
    notes TEXT,
    logged_by VARCHAR(255),
    production_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_date ON production_logs(production_date DESC);
CREATE INDEX idx_production_shift ON production_logs(shift);

-- ============================================
-- 7. DAILY METRICS TABLE (Aggregated daily stats)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Revenue metrics
    total_revenue DECIMAL(15,2) DEFAULT 0,
    cash_revenue DECIMAL(15,2) DEFAULT 0,
    credit_revenue DECIMAL(15,2) DEFAULT 0,
    
    -- Sales metrics
    total_sales_count INTEGER DEFAULT 0,
    total_blocks_sold INTEGER DEFAULT 0,
    average_sale_value DECIMAL(15,2) DEFAULT 0,
    
    -- Production metrics
    blocks_produced INTEGER DEFAULT 0,
    blocks_wasted INTEGER DEFAULT 0,
    production_efficiency DECIMAL(5,2) DEFAULT 0,
    
    -- Cost metrics
    fuel_cost DECIMAL(15,2) DEFAULT 0,
    fuel_liters DECIMAL(10,2) DEFAULT 0,
    other_expenses DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    
    -- Profitability
    gross_profit DECIMAL(15,2) DEFAULT 0,
    net_liquidity DECIMAL(15,2) DEFAULT 0, -- Cash only profit
    cost_per_block DECIMAL(10,2) DEFAULT 0,
    
    -- Efficiency
    fuel_efficiency DECIMAL(6,3) DEFAULT 0, -- L/block
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_date ON daily_metrics(metric_date DESC);

-- ============================================
-- 8. ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- FUEL_EFFICIENCY, CREDIT_LIMIT, LOW_STOCK, OVERDUE_PAYMENT
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- customer, fuel_log, sale, etc.
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_unread ON alerts(is_read, priority);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_date ON alerts(created_at DESC);

-- ============================================
-- 9. INVENTORY TABLE (Optional - for stock tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(255) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'blocks',
    last_restocked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. AUDIT LOG TABLE (Track all changes)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_date ON audit_log(changed_at DESC);


-- ============================================
-- VIEWS
-- ============================================

-- Dashboard Summary View
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
    COALESCE(dm.metric_date, CURRENT_DATE) as report_date,
    COALESCE(dm.total_revenue, 0) as total_revenue,
    COALESCE(dm.cash_revenue, 0) as cash_revenue,
    COALESCE(dm.credit_revenue, 0) as credit_revenue,
    COALESCE(dm.total_blocks_sold, 0) as units_sold,
    COALESCE(dm.total_expenses, 0) as total_expenses,
    COALESCE(dm.net_liquidity, 0) as net_profit_ssp,
    COALESCE(dm.cost_per_block, 0) as efficiency_rating,
    COALESCE(dm.fuel_efficiency, 0) as fuel_efficiency,
    (SELECT COUNT(*) FROM customers WHERE total_credit_due > 0) as overdue_clients,
    (SELECT COALESCE(SUM(total_credit_due), 0) FROM customers) as total_outstanding,
    (SELECT COUNT(*) FROM alerts WHERE is_read = false) as unread_alerts
FROM daily_metrics dm
WHERE dm.metric_date = CURRENT_DATE
LIMIT 1;

-- Customer Risk Summary View
CREATE OR REPLACE VIEW customer_risk_summary AS
SELECT
    c.id,
    c.name,
    c.phone_number,
    c.total_credit_due,
    c.credit_limit,
    c.last_payment_date,
    CASE
        WHEN c.last_payment_date IS NULL AND c.total_credit_due > 0 THEN 90
        ELSE COALESCE(EXTRACT(DAY FROM NOW() - c.last_payment_date)::INTEGER, 0)
    END as days_since_payment,
    CASE
        WHEN c.total_credit_due = 0 THEN 'PAID'
        WHEN c.total_credit_due > c.credit_limit THEN 'CRITICAL'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.last_payment_date, c.created_at)) > 60 THEN 'HIGH'
        WHEN EXTRACT(DAY FROM NOW() - COALESCE(c.last_payment_date, c.created_at)) > 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END as calculated_risk,
    (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as total_transactions,
    (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE customer_id = c.id) as lifetime_value
FROM customers c
WHERE c.is_active = true
ORDER BY c.total_credit_due DESC;


-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update customer credit balance after a sale
CREATE OR REPLACE FUNCTION update_customer_credit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'CREDIT' OR NEW.payment_status = 'PARTIAL' THEN
        UPDATE customers
        SET 
            total_credit_due = total_credit_due + NEW.balance_due,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sale credit updates
CREATE TRIGGER trigger_update_customer_credit
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION update_customer_credit();

-- Function to update customer credit after payment
CREATE OR REPLACE FUNCTION update_credit_after_payment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET 
        total_credit_due = GREATEST(0, total_credit_due - NEW.amount),
        last_payment_date = NOW(),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment credit updates
CREATE TRIGGER trigger_update_credit_after_payment
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_credit_after_payment();

-- Function to calculate fuel efficiency and create alerts
CREATE OR REPLACE FUNCTION check_fuel_efficiency()
RETURNS TRIGGER AS $$
DECLARE
    normal_efficiency DECIMAL := 1.1;
    variance DECIMAL;
BEGIN
    IF NEW.boxes_produced > 0 THEN
        NEW.fuel_efficiency := NEW.liters_added / NEW.boxes_produced;
        variance := ((NEW.fuel_efficiency - normal_efficiency) / normal_efficiency) * 100;
        NEW.efficiency_variance := variance;
        
        IF NEW.fuel_efficiency > 1.2 THEN
            NEW.alert_level := 'CRITICAL';
            -- Create alert
            INSERT INTO alerts (alert_type, priority, title, message, related_entity_type, related_entity_id)
            VALUES (
                'FUEL_EFFICIENCY',
                'high',
                'Abnormal Fuel Consumption',
                'Fuel efficiency is ' || ROUND(variance::numeric, 1) || '% above normal. Expected: ' || 
                ROUND((NEW.boxes_produced * normal_efficiency)::numeric, 0) || 'L, Actual: ' || NEW.liters_added || 'L',
                'fuel_log',
                NEW.id
            );
        ELSIF NEW.fuel_efficiency > 1.15 THEN
            NEW.alert_level := 'WARNING';
        ELSE
            NEW.alert_level := 'NORMAL';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for fuel efficiency check
CREATE TRIGGER trigger_check_fuel_efficiency
BEFORE INSERT OR UPDATE ON fuel_logs
FOR EACH ROW
EXECUTE FUNCTION check_fuel_efficiency();

-- Function to update daily metrics
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
BEGIN
    target_date := CURRENT_DATE;
    
    INSERT INTO daily_metrics (metric_date)
    VALUES (target_date)
    ON CONFLICT (metric_date) DO NOTHING;
    
    -- Update the metrics
    UPDATE daily_metrics
    SET
        total_revenue = (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE(created_at) = target_date),
        cash_revenue = (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE(created_at) = target_date AND payment_status = 'CASH'),
        credit_revenue = (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE(created_at) = target_date AND payment_status = 'CREDIT'),
        total_sales_count = (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = target_date),
        total_blocks_sold = (SELECT COALESCE(SUM(quantity_blocks), 0) FROM sales WHERE DATE(created_at) = target_date),
        blocks_produced = (SELECT COALESCE(SUM(quantity_produced), 0) FROM production_logs WHERE production_date = target_date),
        blocks_wasted = (SELECT COALESCE(SUM(waste_blocks), 0) FROM production_logs WHERE production_date = target_date),
        fuel_cost = (SELECT COALESCE(SUM(total_cost), 0) FROM fuel_logs WHERE fuel_date = target_date),
        fuel_liters = (SELECT COALESCE(SUM(liters_added), 0) FROM fuel_logs WHERE fuel_date = target_date),
        other_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date = target_date AND category != 'FUEL'),
        updated_at = NOW()
    WHERE metric_date = target_date;
    
    -- Calculate derived metrics
    UPDATE daily_metrics
    SET
        total_expenses = fuel_cost + other_expenses,
        gross_profit = total_revenue - fuel_cost - other_expenses,
        net_liquidity = cash_revenue - fuel_cost - other_expenses,
        average_sale_value = CASE WHEN total_sales_count > 0 THEN total_revenue / total_sales_count ELSE 0 END,
        cost_per_block = CASE WHEN total_blocks_sold > 0 THEN (fuel_cost + other_expenses) / total_blocks_sold ELSE 0 END,
        fuel_efficiency = CASE WHEN blocks_produced > 0 THEN fuel_liters / blocks_produced ELSE 0 END,
        production_efficiency = CASE WHEN blocks_produced > 0 THEN ((blocks_produced - blocks_wasted)::DECIMAL / blocks_produced) * 100 ELSE 0 END
    WHERE metric_date = target_date;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update daily metrics
CREATE TRIGGER trigger_update_metrics_on_sale
AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH STATEMENT
EXECUTE FUNCTION update_daily_metrics();

CREATE TRIGGER trigger_update_metrics_on_fuel
AFTER INSERT OR UPDATE OR DELETE ON fuel_logs
FOR EACH STATEMENT
EXECUTE FUNCTION update_daily_metrics();

CREATE TRIGGER trigger_update_metrics_on_production
AFTER INSERT OR UPDATE OR DELETE ON production_logs
FOR EACH STATEMENT
EXECUTE FUNCTION update_daily_metrics();

CREATE TRIGGER trigger_update_metrics_on_expense
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH STATEMENT
EXECUTE FUNCTION update_daily_metrics();


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (allow all for now - customize based on roles)
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON fuel_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON production_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON daily_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON alerts FOR ALL USING (auth.role() = 'authenticated');

-- For service role (N8N) - allow full access
CREATE POLICY "Service role full access" ON customers FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON sales FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON payments FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON expenses FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON fuel_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON production_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON daily_metrics FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access" ON alerts FOR ALL USING (auth.jwt()->>'role' = 'service_role');


-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert sample customers
INSERT INTO customers (name, phone_number, total_credit_due) VALUES
('Abdullahi Ali', '+211 912 345 678', 125000),
('Hassan Mahmoud', '+211 922 111 222', 450000),
('Zahra Farah', '+211 955 888 777', 0),
('Mustafa Osman', '+211 911 000 999', 85000),
('Walk-in Customer', 'N/A', 0);

-- Insert today's metric entry
INSERT INTO daily_metrics (metric_date) VALUES (CURRENT_DATE) ON CONFLICT DO NOTHING;

