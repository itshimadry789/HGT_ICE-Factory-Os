import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID'),
    quantity_blocks: z.number().int().positive('Quantity must be positive'),
    unit_price: z.number().positive('Unit price must be positive'),
    payment_status: z.enum(['CASH', 'CREDIT', 'PARTIAL']),
    amount_paid: z.number().min(0).optional(),
    notes: z.string().optional(),
    sold_by: z.string().optional(),
  }),
});

export const getSalesSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    customer_id: z.string().uuid().optional(),
    payment_status: z.enum(['CASH', 'CREDIT', 'PARTIAL']).optional(),
  }),
});

export const getSaleByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid sale ID'),
  }),
});

