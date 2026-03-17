import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID'),
    sale_id: z.string().uuid('Invalid sale ID').optional(),
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY']).default('CASH'),
    reference_number: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const getPaymentsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
    customer_id: z.string().uuid().optional(),
  }).optional(),
});

export const getPaymentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment ID'),
  }),
});
