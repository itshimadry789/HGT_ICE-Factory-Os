import { getSupabaseClient } from '../config/supabase';
import { ProductionLog } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class ProductionRepository {
  private supabase = getSupabaseClient();

  async findAll(limit = 50, offset = 0, filters?: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }): Promise<ProductionLog[]> {
    let query = this.supabase
      .from('production_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.startDate) {
      query = query.gte('production_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('production_date', filters.endDate);
    }

    if (filters?.shift) {
      query = query.eq('shift', filters.shift);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch production logs: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }

  async create(log: Partial<ProductionLog>): Promise<ProductionLog> {
    const quantityProduced = log.quantity_produced || 0;
    const wasteBlocks = log.waste_blocks || 0;
    const wastePercentage = quantityProduced > 0 
      ? (wasteBlocks / quantityProduced) * 100 
      : 0;

    // Remove good_blocks from log since it's a GENERATED ALWAYS column
    const { good_blocks, ...logWithoutGoodBlocks } = log;

    const { data, error } = await this.supabase
      .from('production_logs')
      .insert([{
        ...logWithoutGoodBlocks,
        waste_percentage: wastePercentage,
        production_date: log.production_date || new Date().toISOString().split('T')[0],
      }])
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create production log: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }
}

