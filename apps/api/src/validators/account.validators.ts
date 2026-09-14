import { z } from 'zod';

const objectId = z.string().min(1);

export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    type: z.enum(['bank', 'cash', 'credit_card', 'debit', 'wallet', 'investment']),
    institution: z.string().max(120).optional(),
    accountNumberMasked: z.string().max(32).optional(),
    currentBalance: z.number().finite().default(0),
    availableBalance: z.number().finite().optional(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']).default('INR'),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().min(1).max(120).optional(),
      type: z
        .enum(['bank', 'cash', 'credit_card', 'debit', 'wallet', 'investment'])
        .optional(),
      institution: z.string().max(120).optional(),
      accountNumberMasked: z.string().max(32).optional(),
      currentBalance: z.number().finite().optional(),
      availableBalance: z.number().finite().optional(),
      currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
});

export const accountIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});
