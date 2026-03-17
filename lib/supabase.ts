
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables - set these in your .env file
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Only create client if credentials are provided
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
  }
} else {
  console.warn('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');
}

export { supabase };

// ============================================
// Type Definitions
// ============================================

export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  total_credit_due: number;
  credit_limit: number;
  last_payment_date?: string;
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

// ============================================
// API Functions
// ============================================

// Dashboard
export const getDashboardSummary = async (): Promise<DashboardSummary | null> => {
  const { data, error } = await supabase
    .from('dashboard_summary')
    .select('*')
    .single();
  
  if (error) {
    console.error('Error fetching dashboard summary:', error);
    return null;
  }
  return data;
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  return data || [];
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
  return data;
};

export const createCustomer = async (customer: Partial<Customer>): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating customer:', error);
    return null;
  }
  return data;
};

// Sales
export const getSales = async (limit = 50): Promise<Sale[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
  return data || [];
};

export const createSale = async (sale: Partial<Sale>): Promise<Sale | null> => {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }
  
  console.log('Creating sale with data:', sale);
  
  const { data, error } = await supabase
    .from('sales')
    .insert([{
      ...sale,
      balance_due: sale.payment_status === 'CASH' ? 0 : sale.total_amount
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating sale:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to create sale: ${error.message}`);
  }
  
  console.log('Sale created successfully:', data);
  return data;
};

// Payments
export const createPayment = async (payment: Partial<Payment>): Promise<Payment | null> => {
  const { data, error } = await supabase
    .from('payments')
    .insert([payment])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating payment:', error);
    return null;
  }
  return data;
};

// Expenses
export const getExpenses = async (limit = 50): Promise<Expense[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
  return data || [];
};

export const createExpense = async (expense: Partial<Expense>): Promise<Expense | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating expense:', error);
    return null;
  }
  return data;
};

// Fuel Logs
export const getFuelLogs = async (limit = 50): Promise<FuelLog[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('fuel_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching fuel logs:', error);
    return [];
  }
  return data || [];
};

export const createFuelLog = async (fuelLog: Partial<FuelLog>): Promise<FuelLog | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('fuel_logs')
    .insert([fuelLog])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating fuel log:', error);
    return null;
  }
  return data;
};

// Production Logs
export const getProductionLogs = async (limit = 50): Promise<ProductionLog[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('production_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching production logs:', error);
    return [];
  }
  return data || [];
};

export const createProductionLog = async (log: Partial<ProductionLog>): Promise<ProductionLog | null> => {
  if (!supabase) return null;
  const wastePercentage = log.quantity_produced && log.quantity_produced > 0
    ? ((log.waste_blocks || 0) / log.quantity_produced) * 100
    : 0;

  const { data, error } = await supabase
    .from('production_logs')
    .insert([{
      ...log,
      waste_percentage: wastePercentage
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating production log:', error);
    return null;
  }
  return data;
};

// Alerts
export const getAlerts = async (unreadOnly = false): Promise<Alert[]> => {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  const { data, error } = await query.limit(50);
  
  if (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
  return data || [];
};

export const markAlertAsRead = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id);
  
  if (error) {
    console.error('Error marking alert as read:', error);
    return false;
  }
  return true;
};

// Daily Metrics
export const getDailyMetrics = async (days = 7): Promise<DailyMetrics[]> => {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(days);
  
  if (error) {
    console.error('Error fetching daily metrics:', error);
    return [];
  }
  return data || [];
};

// ============================================
// Real-time Subscriptions
// ============================================

export const subscribeToAlerts = (callback: (alert: Alert) => void) => {
  if (!supabase) return { unsubscribe: () => {} };
  return supabase
    .channel('alerts_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alerts' },
      (payload) => {
        callback(payload.new as Alert);
      }
    )
    .subscribe();
};

export const subscribeToMetrics = (callback: (metrics: DailyMetrics) => void) => {
  return supabase
    .channel('metrics_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'daily_metrics' },
      (payload) => {
        callback(payload.new as DailyMetrics);
      }
    )
    .subscribe();
};

export const subscribeToSales = (callback: (sale: Sale) => void) => {
  return supabase
    .channel('sales_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sales' },
      (payload) => {
        callback(payload.new as Sale);
      }
    )
    .subscribe();
};

