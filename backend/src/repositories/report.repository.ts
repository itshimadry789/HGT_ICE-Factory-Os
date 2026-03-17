import { getSupabaseClient } from '../config/supabase';
import { DailyMetrics, DashboardSummary } from '../types';
import { AppError } from '../middlewares/error.middleware';

export interface AggregatedFinancials {
  total_revenue: number;
  total_expenses: number;
  total_fuel_costs: number;
  total_production: number;
  // Payment channel breakdown
  cash_revenue: number;
  credit_revenue: number;
}

export class ReportRepository {
  private supabase = getSupabaseClient();

  async getDailyMetrics(date?: string, days = 7): Promise<DailyMetrics[]> {
    let query = this.supabase
      .from('daily_metrics')
      .select('*')
      .order('metric_date', { ascending: false });

    if (date) {
      query = query.eq('metric_date', date);
    } else {
      query = query.limit(days);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch daily metrics: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }

  async getDashboardSummary(): Promise<DashboardSummary | null> {
    const { data, error } = await this.supabase
      .from('dashboard_summary')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new AppError(
        `Failed to fetch dashboard summary: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data;
  }

  async getMonthlyReport(year: string, month: string): Promise<DailyMetrics[]> {
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    const { data, error } = await this.supabase
      .from('daily_metrics')
      .select('*')
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: true });

    if (error) {
      throw new AppError(
        `Failed to fetch monthly report: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }

    return data || [];
  }

  /**
   * Get aggregated financial data for a specific date range
   * Includes payment channel breakdown (Cash vs Credit)
   */
  async getAggregatedFinancials(startDate: Date, endDate: Date): Promise<AggregatedFinancials> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();

    try {
      // Get sales data with payment status breakdown (using timestamp field)
      const { data: salesData, error: salesError } = await this.supabase
        .from('sales')
        .select('total_amount, payment_status')
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime);

      if (salesError) {
        throw new AppError(
          `Failed to fetch sales data: ${salesError.message}`,
          'DATABASE_ERROR',
          500
        );
      }

      // Calculate total revenue and payment channel breakdown
      let total_revenue = 0;
      let cash_revenue = 0;
      let credit_revenue = 0;

      salesData?.forEach(sale => {
        const amount = sale.total_amount || 0;
        total_revenue += amount;
        
        if (sale.payment_status === 'CASH') {
          cash_revenue += amount;
        } else if (sale.payment_status === 'CREDIT' || sale.payment_status === 'PARTIAL') {
          credit_revenue += amount;
        }
      });

      // Get total expenses (all categories including salaries, food, maintenance, etc.)
      const { data: expensesData, error: expensesError } = await this.supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startDateStr)
        .lte('expense_date', endDateStr);

      if (expensesError) {
        throw new AppError(
          `Failed to fetch expenses data: ${expensesError.message}`,
          'DATABASE_ERROR',
          500
        );
      }

      const variable_expenses = expensesData?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

      // Fixed costs (salary, utilities, rent, etc.)
      const { data: fixedCostsData, error: fixedCostsError } = await this.supabase
        .from('fixed_costs')
        .select('amount')
        .gte('cost_date', startDateStr)
        .lte('cost_date', endDateStr);

      // If the table doesn't exist yet in a given environment, fail gracefully by treating as zero.
      // This prevents breaking dashboards during rollout.
      const fixed_costs_total = fixedCostsError
        ? 0
        : (fixedCostsData?.reduce((sum, row) => sum + (row.amount || 0), 0) || 0);

      const total_expenses = variable_expenses + fixed_costs_total;

      // Get total fuel costs (from fuel_logs table, tracked separately)
      const { data: fuelData, error: fuelError } = await this.supabase
        .from('fuel_logs')
        .select('total_cost')
        .gte('fuel_date', startDateStr)
        .lte('fuel_date', endDateStr);

      if (fuelError) {
        throw new AppError(
          `Failed to fetch fuel data: ${fuelError.message}`,
          'DATABASE_ERROR',
          500
        );
      }

      const total_fuel_costs = fuelData?.reduce((sum, fuel) => sum + (fuel.total_cost || 0), 0) || 0;

      // Get total production
      const { data: productionData, error: productionError } = await this.supabase
        .from('production_logs')
        .select('quantity_produced')
        .gte('production_date', startDateStr)
        .lte('production_date', endDateStr);

      if (productionError) {
        throw new AppError(
          `Failed to fetch production data: ${productionError.message}`,
          'DATABASE_ERROR',
          500
        );
      }

      const total_production = productionData?.reduce((sum, prod) => sum + (prod.quantity_produced || 0), 0) || 0;

      return {
        total_revenue,
        total_expenses,
        total_fuel_costs,
        total_production,
        cash_revenue,
        credit_revenue,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to aggregate financials: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }
  }

  /**
   * Get top customers by revenue for a specific date
   * Returns customers with their total revenue for the day
   */
  async getTopCustomersByRevenue(date: Date, limit = 3): Promise<Array<{ customer_id: string; customer_name: string; total_revenue: number }>> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();

    try {
      // Get sales for today
      const { data: salesData, error: salesError } = await this.supabase
        .from('sales')
        .select('customer_id, total_amount')
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)
        .not('customer_id', 'is', null);

      if (salesError) {
        throw new AppError(
          `Failed to fetch sales data: ${salesError.message}`,
          'DATABASE_ERROR',
          500
        );
      }

      if (!salesData || salesData.length === 0) {
        return [];
      }

      // Group by customer and sum revenue
      const customerRevenueMap = new Map<string, { customer_id: string; total_revenue: number }>();

      salesData.forEach((sale: any) => {
        const customerId = sale.customer_id;
        const amount = sale.total_amount || 0;

        if (customerRevenueMap.has(customerId)) {
          const existing = customerRevenueMap.get(customerId)!;
          existing.total_revenue += amount;
        } else {
          customerRevenueMap.set(customerId, {
            customer_id: customerId,
            total_revenue: amount,
          });
        }
      });

      // Get customer names for all unique customer IDs
      const customerIds = Array.from(customerRevenueMap.keys());
      const { data: customersData, error: customersError } = await this.supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds);

      if (customersError) {
        throw new AppError(
          `Failed to fetch customer data: ${customersError.message}`,
          'DATABASE_ERROR',
          500
        );
      }

      // Create a map of customer IDs to names
      const customerNameMap = new Map<string, string>();
      customersData?.forEach((customer: any) => {
        customerNameMap.set(customer.id, customer.name || 'Unknown');
      });

      // Combine revenue data with customer names
      const topCustomers = Array.from(customerRevenueMap.values())
        .map(customer => ({
          customer_id: customer.customer_id,
          customer_name: customerNameMap.get(customer.customer_id) || 'Unknown',
          total_revenue: customer.total_revenue,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);

      return topCustomers;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to get top customers: ${error.message}`,
        'DATABASE_ERROR',
        500
      );
    }
  }
}
