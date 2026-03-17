import { getSupabaseClient } from '../config/supabase';
import { FixedCost } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class FixedCostRepository {
  private supabase = getSupabaseClient();

  async findAll(
    limit = 50,
    offset = 0,
    filters?: {
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FixedCost[]> {
    let query = this.supabase
      .from('fixed_costs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('cost_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('cost_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(`Failed to fetch fixed costs: ${error.message}`, 'DATABASE_ERROR', 500);
    }

    return data || [];
  }

  async create(fixedCost: Partial<FixedCost>): Promise<FixedCost> {
    const { data, error } = await this.supabase
      .from('fixed_costs')
      .insert([
        {
          ...fixedCost,
          currency: fixedCost.currency || 'SSP',
          cost_date: fixedCost.cost_date || new Date().toISOString().split('T')[0],
        },
      ])
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create fixed cost: ${error.message}`, 'DATABASE_ERROR', 500);
    }

    return data;
  }
}

