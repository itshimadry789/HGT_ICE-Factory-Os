import { z } from 'zod';

export const createProductionLogSchema = z.object({
  body: z.object({
    quantity_produced: z.number().int().min(0, 'Quantity must be non-negative'),
    waste_blocks: z.number().int().min(0).default(0),
    shift: z.enum(['Morning', 'Afternoon', 'Night']),
    runtime_hours: z.number().positive().optional(),
    machine_issues: z.string().optional(),
    notes: z.string().optional(),
    logged_by: z.string().optional(),
    production_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  }),
});

export const getProductionLogsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    shift: z.enum(['Morning', 'Afternoon', 'Night']).optional(),
  }),
});

