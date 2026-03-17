import { Request, Response } from 'express';
import { FuelService } from '../services/fuel.service';
import { ApiResponse } from '../types';

export class FuelController {
  private fuelService = new FuelService();

  async createFuelLog(req: Request, res: Response): Promise<void> {
    try {
      const logData = req.body;
      const userId = req.user?.id;

      const log = await this.fuelService.createFuelLog(logData, userId);

      const response: ApiResponse<typeof log> = {
        success: true,
        data: log,
      };

      res.status(201).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getFuelLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;

      const logs = await this.fuelService.getFuelLogs(limit, offset, {
        startDate,
        endDate,
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

