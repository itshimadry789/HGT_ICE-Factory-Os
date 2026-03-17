import { ExpenseRepository } from '../repositories/expense.repository';
import { Expense } from '../types';
import { notifyN8n } from '../webhooks/n8n.webhook';

export class ExpenseService {
  private expenseRepo = new ExpenseRepository();

  async createExpense(expenseData: Partial<Expense>, userId?: string): Promise<Expense> {
    const expense = await this.expenseRepo.create({
      ...expenseData,
      approved_by: userId,
    });

    await notifyN8n('expense.added', {
      expense_id: expense.id,
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
    });

    return expense;
  }

  async getExpenses(limit = 50, offset = 0, filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> {
    return this.expenseRepo.findAll(limit, offset, filters);
  }
}

