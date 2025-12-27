
import { Customer, Sale, Expense, FuelLog, ProductionLog, PaymentStatus, ExpenseCategory } from './types';

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Abdullahi Ali', phone_number: '+211 912 345 678', total_credit_due: 125000 },
  { id: 'c2', name: 'Hassan Mahmoud', phone_number: '+211 922 111 222', total_credit_due: 450000 },
  { id: 'c3', name: 'Zahra Farah', phone_number: '+211 955 888 777', total_credit_due: 0 },
  { id: 'c4', name: 'Mustafa Osman', phone_number: '+211 911 000 999', total_credit_due: 85000 },
  { id: 'c5', name: 'Walk-in Customer', phone_number: 'N/A', total_credit_due: 0 },
];

export const MOCK_SALES: Sale[] = [
  { id: 's1', created_at: new Date().toISOString(), customer_id: 'c1', quantity_blocks: 10, unit_price: 25000, total_amount: 250000, payment_status: PaymentStatus.CASH },
  { id: 's2', created_at: new Date().toISOString(), customer_id: 'c2', quantity_blocks: 5, unit_price: 25000, total_amount: 125000, payment_status: PaymentStatus.CREDIT },
  { id: 's3', created_at: new Date().toISOString(), customer_id: 'c5', quantity_blocks: 20, unit_price: 25000, total_amount: 500000, payment_status: PaymentStatus.CASH },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', category: ExpenseCategory.FOOD, description: 'Lunch for staff', amount: 15000, currency: 'SSP', created_at: new Date().toISOString() },
  { id: 'e2', category: ExpenseCategory.MAINTENANCE, description: 'Compressor oil', amount: 45000, currency: 'SSP', created_at: new Date().toISOString() },
];

export const MOCK_FUEL_LOGS: FuelLog[] = [
  { id: 'f1', liters_added: 50, cost_per_liter: 4000, generator_hours_run: 8, total_cost: 200000, created_at: new Date().toISOString() },
];

export const MOCK_PRODUCTION_LOGS: ProductionLog[] = [
  { id: 'p1', quantity_produced: 250, shift: 'Morning', notes: 'Standard run', created_at: new Date().toISOString() },
];
