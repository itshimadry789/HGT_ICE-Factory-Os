
export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  total_credit_due: number;
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
  SALARY = 'SALARY',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface FuelLog {
  id: string;
  liters_added: number;
  cost_per_liter: number;
  generator_hours_run: number;
  total_cost: number;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  quantity_produced: number;
  shift: string; // e.g. 'Day', 'Night'
  notes?: string;
  created_at: string;
}

export type ViewState = 'DASHBOARD' | 'NEW_SALE' | 'LOG_FUEL' | 'ADD_EXPENSE' | 'REPORTS' | 'CUSTOMERS' | 'PRODUCTION_LOG';
