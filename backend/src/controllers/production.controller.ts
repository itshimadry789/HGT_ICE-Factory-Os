import { Request, Response } from 'express';
import { ProductionService } from '../services/production.service';
import { ApiResponse } from '../types';

export class ProductionController {
  private productionService = new ProductionService();

  async createProductionLog(req: Request, res: Response): Promise<void> {
    try {
      const logData = req.body;
      const userId = req.user?.id;

      const log = await this.productionService.createProductionLog(logData, userId);

      const response: ApiResponse<typeof log> = {
        success: true,
        data: log,
      };

      res.status(201).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getProductionLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;
      const shift = req.query.shift as string | undefined;

      const logs = await this.productionService.getProductionLogs(limit, offset, {
        startDate,
        endDate,
        shift,
      });

      const response: ApiResponse<typeof logs> = {
        success: true,
        data: logs,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }
}

