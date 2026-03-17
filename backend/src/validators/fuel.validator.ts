import { z } from 'zod';

export const createFuelLogSchema = z.object({
  body: z.object({
    liters_added: z.number().positive('Liters must be positive'),
    cost_per_liter: z.number().positive('Cost per liter must be positive'),
    generator_hours_run: z.number().min(0).optional(),
    boxes_produced: z.number().int().min(0).default(0),
    supplier: z.string().optional(),
    notes: z.string().optional(),
    logged_by: z.string().optional(),
    fuel_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  }),
});

export const getFuelLogsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

