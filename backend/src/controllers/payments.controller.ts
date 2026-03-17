import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { ApiResponse } from '../types';

export class PaymentsController {
  private paymentService = new PaymentService();

  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentData = req.body;
      const userId = req.user?.id;

      const payment = await this.paymentService.createPayment(paymentData, userId);

      const response: ApiResponse<typeof payment> = {
        success: true,
        data: payment,
      };

      res.status(201).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const customerId = req.query.customer_id as string | undefined;

      const payments = await this.paymentService.getPayments(limit, offset, { customerId });

      const response: ApiResponse<typeof payments> = {
        success: true,
        data: payments,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await this.paymentService.getPaymentById(id);

      const response: ApiResponse<typeof payment> = {
        success: true,
        data: payment,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }
}
