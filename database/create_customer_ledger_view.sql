-- ============================================
-- CUSTOMER LEDGER VIEW
-- ============================================
-- This view combines sales and payments into a unified ledger format
-- for each customer, showing all transactions in chronological order

CREATE OR REPLACE VIEW customer_ledger_view AS
WITH sales_entries AS (
  SELECT 
    s.id,
    s.customer_id,
    s.created_at::DATE as date,
    'SALE' as type,
    CASE 
      WHEN s.payment_status = 'CASH' THEN 'Cash Sale - ' || s.quantity_blocks || ' blocks'
      WHEN s.payment_status = 'CREDIT' THEN 'Credit Sale - ' || s.quantity_blocks || ' blocks'
      WHEN s.payment_status = 'PARTIAL' THEN 'Partial Payment Sale - ' || s.quantity_blocks || ' blocks'
    END as description,
    s.total_amount as debit,
    0 as credit,
    s.id as reference_id
  FROM sales s
  WHERE s.customer_id IS NOT NULL
),
payment_entries AS (
  SELECT 
    p.id,
    p.customer_id,
    p.created_at::DATE as date,
    'PAYMENT' as type,
    'Payment Received - ' || COALESCE(p.payment_method, 'CASH') as description,
    0 as debit,
    p.amount as credit,
    p.sale_id as reference_id
  FROM payments p
  WHERE p.customer_id IS NOT NULL
),
all_entries AS (
  SELECT * FROM sales_entries
  UNION ALL
  SELECT * FROM payment_entries
)
SELECT 
  ae.id,
  ae.customer_id,
  ae.date,
  ae.type::TEXT as type,
  ae.description,
  ae.debit,
  ae.credit,
  ae.reference_id,
  -- Calculate running balance
  (
    SELECT COALESCE(SUM(debit - credit), 0)
    FROM all_entries ae2
    WHERE ae2.customer_id = ae.customer_id
      AND (ae2.date < ae.date OR (ae2.date = ae.date AND ae2.id <= ae.id))
  ) as balance
FROM all_entries ae
ORDER BY ae.customer_id, ae.date DESC, ae.id DESC;

-- Grant permissions
GRANT SELECT ON customer_ledger_view TO authenticated;
GRANT SELECT ON customer_ledger_view TO anon;

-- Add comment
COMMENT ON VIEW customer_ledger_view IS 'Unified ledger view combining sales (debits) and payments (credits) for each customer with running balance';
