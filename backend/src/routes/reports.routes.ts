import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateApiSecret } from '../middlewares/api-secret.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  getDailyReportSchema,
  getMonthlyReportSchema,
  getCustomerReportSchema,
} from '../validators/reports.validator';

const router = Router();
const controller = new ReportsController();

router.get(
  '/daily',
  authenticate,
  validate(getDailyReportSchema),
  (req, res, next) => controller.getDailyReport(req, res).catch(next)
);

router.get(
  '/monthly',
  authenticate,
  validate(getMonthlyReportSchema),
  (req, res, next) => controller.getMonthlyReport(req, res).catch(next)
);

router.get(
  '/dashboard',
  authenticate,
  (req, res, next) => controller.getDashboardSummary(req, res).catch(next)
);

router.get(
  '/customer/:id',
  authenticate,
  validate(getCustomerReportSchema),
  (req, res, next) => controller.getCustomerReport(req, res).catch(next)
);

router.get(
  '/export/daily-pdf',
  validateApiSecret,
  (req, res, next) => controller.exportDailyPdf(req, res).catch(next)
);

export default router;

