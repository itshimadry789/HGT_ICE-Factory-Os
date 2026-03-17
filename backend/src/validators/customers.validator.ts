import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    phone_number: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email').optional(),
    address: z.string().optional(),
    credit_limit: z.number().min(0).default(0),
    notes: z.string().optional(),
  }),
});

export const getCustomersSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    is_active: z.string().transform(val => val === 'true').optional(),
  }),
});

export const getCustomerByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
});

export const getCustomerLedgerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
  query: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

