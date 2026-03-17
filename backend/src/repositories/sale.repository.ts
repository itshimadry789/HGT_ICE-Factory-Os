import { getSupabaseClient } from '../config/supabase';
import { Sale } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class SaleRepository {
  private supabase = getSupabaseClient();

  async findAll(limit = 50, offset = 0, filters?: {
    customerId?: string;
    paymentStatus?: string;
  }): Promise<Sale[]> {
    let query = this.supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch sales: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }

  async findById(id: string): Promise<Sale | null> {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new AppError(
        `Failed to fetch sale: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }

  async create(sale: Partial<Sale>): Promise<Sale> {
    const totalAmount = (sale.quantity_blocks || 0) * (sale.unit_price || 0);
    const amountPaid = sale.amount_paid || 0;
    const balanceDue = sale.payment_status === 'CASH' 
      ? 0 
      : totalAmount - amountPaid;

    const { data, error } = await this.supabase
      .from('sales')
      .insert([{
        ...sale,
        total_amount: totalAmount,
        balance_due: balanceDue,
      }])
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create sale: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }
}

