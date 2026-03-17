import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service';
import { ApiResponse } from '../types';

export class SalesController {
  private saleService = new SaleService();

  async createSale(req: Request, res: Response): Promise<void> {
    try {
      const saleData = req.body;
      const userId = req.user?.id;

      const sale = await this.saleService.createSale(saleData, userId);

      const response: ApiResponse<typeof sale> = {
        success: true,
        data: sale,
      };

      res.status(201).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getSales(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const customerId = req.query.customer_id as string | undefined;
      const paymentStatus = req.query.payment_status as string | undefined;

      const sales = await this.saleService.getSales(limit, offset, {
        customerId,
        paymentStatus,
      });

      const response: ApiResponse<typeof sales> = {
        success: true,
        data: sales,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getSaleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sale = await this.saleService.getSaleById(id);

      const response: ApiResponse<typeof sale> = {
        success: true,
        data: sale,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }
}

