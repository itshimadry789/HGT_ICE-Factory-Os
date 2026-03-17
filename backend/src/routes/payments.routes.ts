import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createPaymentSchema,
  getPaymentsSchema,
  getPaymentByIdSchema,
} from '../validators/payments.validator';

const router = Router();
const controller = new PaymentsController();

router.post(
  '/',
  authenticate,
  validate(createPaymentSchema),
  (req, res, next) => controller.createPayment(req, res).catch(next)
);

router.get(
  '/',
  authenticate,
  validate(getPaymentsSchema),
  (req, res, next) => controller.getPayments(req, res).catch(next)
);

router.get(
  '/:id',
  authenticate,
  validate(getPaymentByIdSchema),
  (req, res, next) => controller.getPaymentById(req, res).catch(next)
);

export default router;
