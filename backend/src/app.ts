import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import salesRoutes from './routes/sales.routes';
import customersRoutes from './routes/customers.routes';
import productionRoutes from './routes/production.routes';
import fuelRoutes from './routes/fuel.routes';
import expensesRoutes from './routes/expenses.routes';
import fixedCostsRoutes from './routes/fixed-costs.routes';
import reportsRoutes from './routes/reports.routes';
import paymentsRoutes from './routes/payments.routes';
import aiRoutes from './routes/ai.routes';

export function createApp(): Express {
  const app = express();

  // Security middleware - helmet for security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors(corsOptions));

  // Rate limiting - 100 requests per 15 minutes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use('/api', limiter);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/production', productionRoutes);
  app.use('/api/fuel', fuelRoutes);
  app.use('/api/expenses', expensesRoutes);
  app.use('/api/fixed-costs', fixedCostsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

