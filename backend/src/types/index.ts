export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  total_credit_due: number;
  credit_limit: number;
  last_payment_date?: string;
  oldest_credit_date?: string; // Date when the oldest unpaid credit was taken
  days_overdue: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_id: string;
  quantity_blocks: number;
  unit_price: number;
  total_amount: number;
  payment_status: 'CASH' | 'CREDIT' | 'PARTIAL';
  amount_paid: number;
  balance_due: number;
  notes?: string;
  sold_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  sale_id?: string;
  amount: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  reference_number?: string;
  notes?: string;
  received_by?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: 'FUEL' | 'FOOD' | 'SALARY' | 'MAINTENANCE' | 'UTILITIES' | 'SUPPLIES' | 'OTHER';
  description: string;
  amount: number;
  currency: string;
  vendor?: string;
  receipt_number?: string;
  approved_by?: string;
  notes?: string;
  expense_date: string;
  created_at: string;
}

export interface FixedCost {
  id: string;
  category: 'SALARY' | 'UTILITIES' | 'RENT' | 'SECURITY' | 'OTHER';
  description: string;
  amount: number;
  currency: string;
  vendor?: string;
  receipt_number?: string;
  approved_by?: string;
  notes?: string;
  cost_date: string;
  created_at: string;
}

export interface FuelLog {
  id: string;
  liters_added: number;
  cost_per_liter: number;
  total_cost: number;
  generator_hours_run?: number;
  boxes_produced: number;
  fuel_efficiency?: number;
  efficiency_variance?: number;
  alert_level: 'NORMAL' | 'WARNING' | 'CRITICAL';
  supplier?: string;
  notes?: string;
  logged_by?: string;
  fuel_date: string;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  quantity_produced: number;
  waste_blocks: number;
  good_blocks: number;
  waste_percentage?: number;
  shift: 'Morning' | 'Afternoon' | 'Night';
  runtime_hours?: number;
  machine_issues?: string;
  notes?: string;
  logged_by?: string;
  production_date: string;
  created_at: string;
}

export interface DailyMetrics {
  id: string;
  metric_date: string;
  total_revenue: number;
  cash_revenue: number;
  credit_revenue: number;
  total_sales_count: number;
  total_blocks_sold: number;
  average_sale_value: number;
  blocks_produced: number;
  blocks_wasted: number;
  production_efficiency: number;
  fuel_cost: number;
  fuel_liters: number;
  other_expenses: number;
  total_expenses: number;
  gross_profit: number;
  net_liquidity: number;
  cost_per_block: number;
  fuel_efficiency: number;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  alert_type: 'FUEL_EFFICIENCY' | 'CREDIT_LIMIT' | 'LOW_STOCK' | 'OVERDUE_PAYMENT';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface DashboardSummary {
  report_date: string;
  total_revenue: number;
  cash_revenue: number;
  credit_revenue: number;
  units_sold: number;
  total_expenses: number;
  net_profit_ssp: number;
  efficiency_rating: number;
  fuel_efficiency: number;
  overdue_clients: number;
  total_outstanding: number;
  unread_alerts: number;
}

export interface DashboardIntelligenceMetrics {
  net_profit: number;
  total_revenue: number;
  total_burn: number;
  yield_efficiency: number;
  cost_per_unit: number;
  production_count: number;
}

// Extended metrics with comparison and payment channels
export interface DashboardMetricsWithComparison extends DashboardIntelligenceMetrics {
  // Payment channel breakdown
  cash_revenue: number;
  credit_revenue: number;
  cash_percentage: number;
  credit_percentage: number;
  // Comparison data (previous period)
  comparison: {
    net_profit: number;
    total_revenue: number;
    total_burn: number;
    production_count: number;
    // Trend percentages
    revenue_trend: number;
    profit_trend: number;
    burn_trend: number;
    production_trend: number;
  };
  // Period info
  period: {
    start_date: string;
    end_date: string;
    comparison_start_date: string;
    comparison_end_date: string;
    days_in_period: number;
  };
}

export interface CustomerLedgerEntry {
  id: string;
  type: 'SALE' | 'PAYMENT';
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference_id?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

