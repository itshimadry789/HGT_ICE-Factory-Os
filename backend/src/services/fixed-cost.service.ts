import { FixedCostRepository } from '../repositories/fixed-cost.repository';
import { FixedCost } from '../types';
import { notifyN8n } from '../webhooks/n8n.webhook';

export class FixedCostService {
  private fixedCostRepo = new FixedCostRepository();

  async createFixedCost(fixedCostData: Partial<FixedCost>, userId?: string): Promise<FixedCost> {
    const fixedCost = await this.fixedCostRepo.create({
      ...fixedCostData,
      approved_by: userId,
    });

    // Keep webhook event consistent with expenses
    await notifyN8n('fixed_cost.added', {
      fixed_cost_id: fixedCost.id,
      category: fixedCost.category,
      amount: fixedCost.amount,
      cost_date: fixedCost.cost_date,
    });

    return fixedCost;
  }

  async getFixedCosts(
    limit = 50,
    offset = 0,
    filters?: {
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FixedCost[]> {
    return this.fixedCostRepo.findAll(limit, offset, filters);
  }
}

