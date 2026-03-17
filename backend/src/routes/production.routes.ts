import { Router } from 'express';
import { ProductionController } from '../controllers/production.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProductionLogSchema,
  getProductionLogsSchema,
} from '../validators/production.validator';

const router = Router();
const controller = new ProductionController();

router.post(
  '/',
  authenticate,
  validate(createProductionLogSchema),
  (req, res, next) => controller.createProductionLog(req, res).catch(next)
);

router.get(
  '/',
  authenticate,
  validate(getProductionLogsSchema),
  (req, res, next) => controller.getProductionLogs(req, res).catch(next)
);

export default router;

