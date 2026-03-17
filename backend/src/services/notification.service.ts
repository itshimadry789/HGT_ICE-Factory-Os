import { CustomerRepository } from '../repositories/customer.repository';
import { FuelRepository } from '../repositories/fuel.repository';
import { ProductionRepository } from '../repositories/production.repository';

export interface SystemAlert {
  id: string;
  type: 'CREDIT_RISK' | 'FUEL_EFFICIENCY' | 'LOW_PRODUCTION' | 'HIGH_EXPENSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export class NotificationService {
  private customerRepo = new CustomerRepository();
  private fuelRepo = new FuelRepository();
  private productionRepo = new ProductionRepository();

  /**
   * Get all active system alerts
   */
  async getActiveAlerts(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // Check for high-risk customers (credit overdue)
    try {
      const customers = await this.customerRepo.findAll(100, 0);
      const highRiskCustomers = customers.filter(
        (c) => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL'
      );

      if (highRiskCustomers.length > 0) {
        highRiskCustomers.forEach((customer) => {
          alerts.push({
            id: `credit-${customer.id}`,
            type: 'CREDIT_RISK',
            severity: customer.risk_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            title: `Credit Risk: ${customer.name}`,
            message: `Customer has ${customer.total_credit_due} SSP overdue (${customer.days_overdue} days). Risk level: ${customer.risk_level}`,
            timestamp: new Date().toISOString(),
            resolved: false,
          });
        });
      }
    } catch (error) {
      console.error('Error checking credit alerts:', error);
    }

    // Check for fuel efficiency issues
    try {
      const recentFuelLogs = await this.fuelRepo.findAll(10, 0);
      const criticalFuelLogs = recentFuelLogs.filter(
        (log) => log.alert_level === 'CRITICAL' || log.alert_level === 'WARNING'
      );

      if (criticalFuelLogs.length > 0) {
        criticalFuelLogs.forEach((log) => {
          alerts.push({
            id: `fuel-${log.id}`,
            type: 'FUEL_EFFICIENCY',
            severity: log.alert_level === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
            title: `Fuel Efficiency Alert`,
            message: `Fuel efficiency is ${log.fuel_efficiency?.toFixed(2) || 'N/A'} boxes/liter (${log.alert_level}). Date: ${log.fuel_date}`,
            timestamp: log.created_at,
            resolved: false,
          });
        });
      }
    } catch (error) {
      console.error('Error checking fuel alerts:', error);
    }

    // Check for low production (last 7 days)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentProduction = await this.productionRepo.findAll(50, 0, {
        startDate: sevenDaysAgo.toISOString().split('T')[0],
      });

      if (recentProduction.length > 0) {
        const totalProduction = recentProduction.reduce(
          (sum, log) => sum + log.quantity_produced,
          0
        );
        const averageDaily = totalProduction / 7;

        // Alert if average daily production is below 500 blocks (50% of capacity)
        if (averageDaily < 500) {
          alerts.push({
            id: 'low-production',
            type: 'LOW_PRODUCTION',
            severity: averageDaily < 300 ? 'HIGH' : 'MEDIUM',
            title: 'Low Production Alert',
            message: `Average daily production is ${averageDaily.toFixed(0)} blocks over the last 7 days. Target: 750+ blocks/day.`,
            timestamp: new Date().toISOString(),
            resolved: false,
          });
        }
      }
    } catch (error) {
      console.error('Error checking production alerts:', error);
    }

    return alerts;
  }
}
