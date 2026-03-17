import { Router } from 'express';
import { ExpensesController } from '../controllers/expenses.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createExpenseSchema,
  getExpensesSchema,
} from '../validators/expenses.validator';

const router = Router();
const controller = new ExpensesController();

router.post(
  '/',
  authenticate,
  validate(createExpenseSchema),
  (req, res, next) => controller.createExpense(req, res).catch(next)
);

router.get(
  '/',
  authenticate,
  validate(getExpensesSchema),
  (req, res, next) => controller.getExpenses(req, res).catch(next)
);

export default router;

