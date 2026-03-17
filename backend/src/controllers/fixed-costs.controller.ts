import { Request, Response } from 'express';
import { FixedCostService } from '../services/fixed-cost.service';
import { ApiResponse } from '../types';

export class FixedCostsController {
  private fixedCostService = new FixedCostService();

  async createFixedCost(req: Request, res: Response): Promise<void> {
    const fixedCostData = req.body;
    const userId = req.user?.id;

    const fixedCost = await this.fixedCostService.createFixedCost(fixedCostData, userId);

    const response: ApiResponse<typeof fixedCost> = {
      success: true,
      data: fixedCost,
    };

    res.status(201).json(response);
  }

  async getFixedCosts(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;

    const fixedCosts = await this.fixedCostService.getFixedCosts(limit, offset, {
      category,
      startDate,
      endDate,
    });

    const response: ApiResponse<typeof fixedCosts> = {
      success: true,
      data: fixedCosts,
    };

    res.status(200).json(response);
  }
}

