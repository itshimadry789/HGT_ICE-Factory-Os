import { Router } from 'express';
import { FixedCostsController } from '../controllers/fixed-costs.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createFixedCostSchema, getFixedCostsSchema } from '../validators/fixed-costs.validator';

const router = Router();
const controller = new FixedCostsController();

router.post(
  '/',
  authenticate,
  validate(createFixedCostSchema),
  (req, res, next) => controller.createFixedCost(req, res).catch(next)
);

router.get(
  '/',
  authenticate,
  validate(getFixedCostsSchema),
  (req, res, next) => controller.getFixedCosts(req, res).catch(next)
);

export default router;

