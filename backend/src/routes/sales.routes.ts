import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createSaleSchema,
  getSalesSchema,
  getSaleByIdSchema,
} from '../validators/sales.validator';

const router = Router();
const controller = new SalesController();

router.post(
  '/',
  authenticate,
  validate(createSaleSchema),
  (req, res, next) => controller.createSale(req, res).catch(next)
);

router.get(
  '/',
  authenticate,
  validate(getSalesSchema),
  (req, res, next) => controller.getSales(req, res).catch(next)
);

router.get(
  '/:id',
  authenticate,
  validate(getSaleByIdSchema),
  (req, res, next) => controller.getSaleById(req, res).catch(next)
);

export default router;

