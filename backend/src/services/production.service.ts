import { ProductionRepository } from '../repositories/production.repository';
import { ProductionLog } from '../types';
import { notifyN8n } from '../webhooks/n8n.webhook';

export class ProductionService {
  private productionRepo = new ProductionRepository();

  async createProductionLog(logData: Partial<ProductionLog>, userId?: string): Promise<ProductionLog> {
    const log = await this.productionRepo.create({
      ...logData,
      logged_by: userId,
    });

    await notifyN8n('production.logged', {
      production_log_id: log.id,
      quantity_produced: log.quantity_produced,
      waste_blocks: log.waste_blocks,
      shift: log.shift,
      production_date: log.production_date,
    });

    return log;
  }

  async getProductionLogs(limit = 50, offset = 0, filters?: {
    startDate?: string;
    endDate?: string;
    shift?: string;
  }): Promise<ProductionLog[]> {
    return this.productionRepo.findAll(limit, offset, filters);
  }
}

