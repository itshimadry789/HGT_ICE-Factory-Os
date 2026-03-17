import { FuelRepository } from '../repositories/fuel.repository';
import { FuelLog } from '../types';
import { webhookService } from './webhook.service';

export class FuelService {
  private fuelRepo = new FuelRepository();

  async createFuelLog(logData: Partial<FuelLog>, userId?: string): Promise<FuelLog> {
    const fuelLog = await this.fuelRepo.create({
      ...logData,
      logged_by: userId,
    });

    // Fire and forget webhook notification - don't await to avoid slowing down response
    webhookService.notifyN8n('fuel.logged', {
      fuel_log_id: fuelLog.id,
      liters_added: fuelLog.liters_added,
      cost_per_liter: fuelLog.cost_per_liter,
      total_cost: fuelLog.total_cost,
      boxes_produced: fuelLog.boxes_produced,
      fuel_efficiency: fuelLog.fuel_efficiency,
      alert_level: fuelLog.alert_level,
      fuel_date: fuelLog.fuel_date,
      logged_by: fuelLog.logged_by,
    }).catch(() => {
      // Errors are already handled in WebhookService, but catch here to be safe
    });

    return fuelLog;
  }

  async getFuelLogs(limit = 50, offset = 0, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FuelLog[]> {
    return this.fuelRepo.findAll(limit, offset, filters);
  }
}

