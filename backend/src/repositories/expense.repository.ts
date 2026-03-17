import { getSupabaseClient } from '../config/supabase';
import { Expense } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class ExpenseRepository {
  private supabase = getSupabaseClient();

  async findAll(limit = 50, offset = 0, filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> {
    let query = this.supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('expense_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('expense_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch expenses: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }

  async create(expense: Partial<Expense>): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert([{
        ...expense,
        currency: expense.currency || 'SSP',
        expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
      }])
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create expense: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }
}

