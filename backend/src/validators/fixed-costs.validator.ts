import { z } from 'zod';

export const createFixedCostSchema = z.object({
  body: z.object({
    category: z.enum(['SALARY', 'UTILITIES', 'RENT', 'SECURITY', 'OTHER']),
    description: z.string().min(1, 'Description is required'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().default('SSP'),
    vendor: z.string().optional(),
    receipt_number: z.string().optional(),
    approved_by: z.string().optional(),
    notes: z.string().optional(),
    cost_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
  }),
});

export const getFixedCostsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    category: z.enum(['SALARY', 'UTILITIES', 'RENT', 'SECURITY', 'OTHER']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

