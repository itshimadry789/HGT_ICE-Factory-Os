import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { ApiResponse } from '../types';

export class CustomersController {
  private customerService = new CustomerService();

  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerData = req.body;
      const customer = await this.customerService.createCustomer(customerData);

      const response: ApiResponse<typeof customer> = {
        success: true,
        data: customer,
      };

      res.status(201).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const isActive = req.query.is_active === 'true' ? true : undefined;

      const customers = await this.customerService.getCustomers(limit, offset, isActive);

      const response: ApiResponse<typeof customers> = {
        success: true,
        data: customers,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomerById(id);

      const response: ApiResponse<typeof customer> = {
        success: true,
        data: customer,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getCustomerLedger(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;

      const ledger = await this.customerService.getCustomerLedger(id, startDate, endDate);

      const response: ApiResponse<typeof ledger> = {
        success: true,
        data: ledger,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }
}

