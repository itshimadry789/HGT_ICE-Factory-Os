import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { ApiResponse } from '../types';

export class ExpensesController {
  private expenseService = new ExpenseService();

  async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const expenseData = req.body;
      const userId = req.user?.id;

      const expense = await this.expenseService.createExpense(expenseData, userId);

      const response: ApiResponse<typeof expense> = {
        success: true,
        data: expense,
      };

      res.status(201).json(response);
    } catch (error: any) {
      throw error;
    }
  }

  async getExpenses(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string | undefined;
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;

      const expenses = await this.expenseService.getExpenses(limit, offset, {
        category,
        startDate,
        endDate,
      });

      const response: ApiResponse<typeof expenses> = {
        success: true,
        data: expenses,
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw error;
    }
  }
}

