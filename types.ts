
export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  total_credit_due: number;
  oldest_credit_date?: string; // Date when the oldest unpaid credit was taken
  last_payment_date?: string;
  days_overdue?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export enum PaymentStatus {
  CASH = 'CASH',
  CREDIT = 'CREDIT'
}

export interface Sale {
  id: string;
  created_at: string;
  customer_id: string;
  quantity_blocks: number;
  unit_price: number;
  total_amount: number;
  payment_status: PaymentStatus;
}

export enum ExpenseCategory {
  FUEL = 'FUEL',
  FOOD = 'FOOD',
  MAINTENANCE = 'MAINTENANCE',
  SUPPLIES = 'SUPPLIES',
  OTHER = 'OTHER'
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expense_date?: string;
  created_at: string;
}

export enum FixedCostCategory {
  SALARY = 'SALARY',
  UTILITIES = 'UTILITIES',
  RENT = 'RENT',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER'
}

export interface FixedCost {
  id: string;
  category: FixedCostCategory;
  description: string;
  amount: number;
  currency: string;
  cost_date?: string;
  created_at: string;
}

export interface FuelLog {
  id: string;
  liters_added: number;
  cost_per_liter: number;
  generator_hours_run: number;
  total_cost: number;
  fuel_date?: string;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  quantity_produced: number;
  shift: string; // e.g. 'Day', 'Night'
  production_date?: string;
  notes?: string;
  created_at: string;
}

export type ViewState =
  | 'DASHBOARD'
  | 'NEW_SALE'
  | 'LOG_FUEL'
  | 'ADD_EXPENSE'
  | 'FIXED_COSTS'
  | 'REPORTS'
  | 'CUSTOMERS'
  | 'PRODUCTION_LOG';
