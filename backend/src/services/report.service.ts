import { ReportRepository } from '../repositories/report.repository';
import { DailyMetrics, DashboardSummary, DashboardIntelligenceMetrics } from '../types';
import { MAX_DAILY_PRODUCTION_CAPACITY } from '../config/factory-settings';

// Extended metrics interface with comparison and payment channels
export interface DashboardMetricsWithComparison extends DashboardIntelligenceMetrics {
  // Payment channel breakdown
  cash_revenue: number;
  credit_revenue: number;
  cash_percentage: number;
  credit_percentage: number;
  // Comparison data (previous period)
  comparison: {
    net_profit: number;
    total_revenue: number;
    total_burn: number;
    production_count: number;
    // Trend percentages
    revenue_trend: number;
    profit_trend: number;
    burn_trend: number;
    production_trend: number;
  };
  // Period info
  period: {
    start_date: string;
    end_date: string;
    comparison_start_date: string;
    comparison_end_date: string;
    days_in_period: number;
  };
}

export class ReportService {
  private reportRepo = new ReportRepository();

  async getDailyReport(date?: string, days = 7): Promise<DailyMetrics[]> {
    return this.reportRepo.getDailyMetrics(date, days);
  }

  async getMonthlyReport(year?: string, month?: string): Promise<DailyMetrics[]> {
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear().toString();
    const reportMonth = month || String(currentDate.getMonth() + 1).padStart(2, '0');

    return this.reportRepo.getMonthlyReport(reportYear, reportMonth);
  }

  async getDashboardSummary(): Promise<DashboardSummary | null> {
    return this.reportRepo.getDashboardSummary();
  }

  /**
   * Get comprehensive dashboard data with comparison metrics
   * Returns current period data + comparison to previous period
   */
  async getDashboardData(startDate?: Date, endDate?: Date): Promise<DashboardMetricsWithComparison> {
    // Default to today if no dates provided
    const now = new Date();
    const end = endDate ? new Date(endDate) : new Date(now);
    const start = startDate ? new Date(startDate) : new Date(now);

    // If only endDate is provided, default startDate to same day (for "today" queries)
    if (!startDate && endDate) {
      start.setTime(end.getTime());
    }

    // Reset time to start/end of day for accurate date filtering
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Calculate days in period
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;

    // Calculate comparison period (same duration, immediately before)
    const comparisonEnd = new Date(start);
    comparisonEnd.setDate(comparisonEnd.getDate() - 1);
    comparisonEnd.setHours(23, 59, 59, 999);
    
    const comparisonStart = new Date(comparisonEnd);
    comparisonStart.setDate(comparisonStart.getDate() - daysDiff + 1);
    comparisonStart.setHours(0, 0, 0, 0);

    // Fetch data for current period
    const currentData = await this.reportRepo.getAggregatedFinancials(start, end);
    
    // Fetch data for comparison period
    const comparisonData = await this.reportRepo.getAggregatedFinancials(comparisonStart, comparisonEnd);

    // Calculate current period metrics
    // CRITICAL FIX: Total Burn = Operational Expenses + Fuel Costs
    const current_total_burn = currentData.total_expenses + currentData.total_fuel_costs;
    const current_net_profit = currentData.total_revenue - current_total_burn;

    // Calculate comparison period metrics
    const comparison_total_burn = comparisonData.total_expenses + comparisonData.total_fuel_costs;
    const comparison_net_profit = comparisonData.total_revenue - comparison_total_burn;

    // Calculate yield efficiency (percentage of max capacity)
    // For multi-day periods, we calculate efficiency based on average daily production
    const averageDailyProduction = currentData.total_production / daysDiff;
    const yield_efficiency = MAX_DAILY_PRODUCTION_CAPACITY > 0
      ? Math.min(100, (averageDailyProduction / MAX_DAILY_PRODUCTION_CAPACITY) * 100)
      : 0;

    // Calculate cost per unit (handle division by zero)
    const cost_per_unit = currentData.total_production > 0
      ? current_total_burn / currentData.total_production
      : 0;

    // Calculate payment channel percentages
    const cash_percentage = currentData.total_revenue > 0 
      ? (currentData.cash_revenue / currentData.total_revenue) * 100 
      : 0;
    const credit_percentage = currentData.total_revenue > 0 
      ? (currentData.credit_revenue / currentData.total_revenue) * 100 
      : 0;

    // Calculate trend percentages (comparison to previous period)
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    const revenue_trend = calculateTrend(currentData.total_revenue, comparisonData.total_revenue);
    const profit_trend = calculateTrend(current_net_profit, comparison_net_profit);
    const burn_trend = calculateTrend(current_total_burn, comparison_total_burn);
    const production_trend = calculateTrend(currentData.total_production, comparisonData.total_production);

    return {
      // Core metrics
      net_profit: Math.round(current_net_profit * 100) / 100,
      total_revenue: Math.round(currentData.total_revenue * 100) / 100,
      total_burn: Math.round(current_total_burn * 100) / 100,
      yield_efficiency: Math.round(yield_efficiency * 100) / 100,
      cost_per_unit: Math.round(cost_per_unit * 100) / 100,
      production_count: currentData.total_production,
      
      // Payment channel breakdown
      cash_revenue: Math.round(currentData.cash_revenue * 100) / 100,
      credit_revenue: Math.round(currentData.credit_revenue * 100) / 100,
      cash_percentage: Math.round(cash_percentage * 100) / 100,
      credit_percentage: Math.round(credit_percentage * 100) / 100,
      
      // Comparison data
      comparison: {
        net_profit: Math.round(comparison_net_profit * 100) / 100,
        total_revenue: Math.round(comparisonData.total_revenue * 100) / 100,
        total_burn: Math.round(comparison_total_burn * 100) / 100,
        production_count: comparisonData.total_production,
        revenue_trend: Math.round(revenue_trend * 100) / 100,
        profit_trend: Math.round(profit_trend * 100) / 100,
        burn_trend: Math.round(burn_trend * 100) / 100,
        production_trend: Math.round(production_trend * 100) / 100,
      },
      
      // Period info
      period: {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        comparison_start_date: comparisonStart.toISOString().split('T')[0],
        comparison_end_date: comparisonEnd.toISOString().split('T')[0],
        days_in_period: daysDiff,
      },
    };
  }
}
