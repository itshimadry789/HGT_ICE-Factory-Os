import { getSupabaseClient } from '../config/supabase';
import { Payment } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class PaymentRepository {
  private supabase = getSupabaseClient();

  async create(payment: Partial<Payment>): Promise<Payment> {
    const { data, error } = await this.supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create payment: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }

  async findAll(limit = 50, offset = 0, filters?: {
    customerId?: string;
  }): Promise<Payment[]> {
    let query = this.supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch payments: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new AppError(
        `Failed to fetch payment: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }
}
