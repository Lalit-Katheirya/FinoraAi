import { z } from 'zod';

const objectId = z.string().min(1);

export const createBudgetSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    period: z.enum(['monthly', 'annual', 'category']),
    categoryId: objectId.optional(),
    amount: z.number().positive(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']).default('INR'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    alertThresholds: z.array(z.number().min(0).max(100)).max(10).optional(),
  }),
});

export const updateBudgetSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().min(1).max(120).optional(),
      period: z.enum(['monthly', 'annual', 'category']).optional(),
      categoryId: objectId.nullable().optional(),
      amount: z.number().positive().optional(),
      currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      alertThresholds: z.array(z.number().min(0).max(100)).max(10).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
});

export const budgetIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});
