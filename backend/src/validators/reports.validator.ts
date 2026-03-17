import { z } from 'zod';

export const getDailyReportSchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    days: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const getMonthlyReportSchema = z.object({
  query: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
    year: z.string().regex(/^\d{4}$/, 'Year must be in YYYY format').optional(),
  }),
});

export const getCustomerReportSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
  query: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

