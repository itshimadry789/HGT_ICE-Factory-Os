import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCustomerSchema,
  getCustomersSchema,
  getCustomerByIdSchema,
  getCustomerLedgerSchema,
} from '../validators/customers.validator';

const router = Router();
const controller = new CustomersController();

router.post(
  '/',
  authenticate,
  validate(createCustomerSchema),
  (req, res, next) => controller.createCustomer(req, res).catch(next)
);

router.get(
  '/',
  authenticate,
  validate(getCustomersSchema),
  (req, res, next) => controller.getCustomers(req, res).catch(next)
);

router.get(
  '/:id',
  authenticate,
  validate(getCustomerByIdSchema),
  (req, res, next) => controller.getCustomerById(req, res).catch(next)
);

router.get(
  '/:id/ledger',
  authenticate,
  validate(getCustomerLedgerSchema),
  (req, res, next) => controller.getCustomerLedger(req, res).catch(next)
);

export default router;

