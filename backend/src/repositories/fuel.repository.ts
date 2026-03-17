import { getSupabaseClient } from '../config/supabase';
import { FuelLog } from '../types';
import { AppError } from '../middlewares/error.middleware';

export class FuelRepository {
  private supabase = getSupabaseClient();

  async findAll(limit = 50, offset = 0, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FuelLog[]> {
    let query = this.supabase
      .from('fuel_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.startDate) {
      query = query.gte('fuel_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('fuel_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch fuel logs: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }

  async create(log: Partial<FuelLog>): Promise<FuelLog> {
    const litersAdded = log.liters_added || 0;
    const costPerLiter = log.cost_per_liter || 0;
    const totalCost = litersAdded * costPerLiter;
    const boxesProduced = log.boxes_produced || 0;
    
    let fuelEfficiency: number | undefined;
    let alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';

    if (boxesProduced > 0 && litersAdded > 0) {
      fuelEfficiency = boxesProduced / litersAdded;
      
      if (fuelEfficiency < 10) {
        alertLevel = 'CRITICAL';
      } else if (fuelEfficiency < 15) {
        alertLevel = 'WARNING';
      }
    }

    const { data, error } = await this.supabase
      .from('fuel_logs')
      .insert([{
        ...log,
        total_cost: totalCost,
        fuel_efficiency: fuelEfficiency,
        alert_level: alertLevel,
        fuel_date: log.fuel_date || new Date().toISOString().split('T')[0],
      }])
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create fuel log: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }
}

