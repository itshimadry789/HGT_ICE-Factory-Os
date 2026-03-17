import { Router } from 'express';
import { FuelController } from '../controllers/fuel.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createFuelLogSchema,
  getFuelLogsSchema,
} from '../validators/fuel.validator';

const router = Router();
const controller = new FuelController();

router.post(
  '/',
  authenticate,
  validate(createFuelLogSchema),
  (req, res, next) => controller.createFuelLog(req, res).catch(next)
);

router.get(
  '/',
  authenticate,
  validate(getFuelLogsSchema),
  (req, res, next) => controller.getFuelLogs(req, res).catch(next)
);

export default router;

