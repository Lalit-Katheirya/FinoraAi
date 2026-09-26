import { z } from 'zod';

const objectId = z.string().min(1);

export const createInvestmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    type: z.enum(['mutual_fund', 'stock', 'etf', 'fd', 'gold', 'ppf', 'other']),
    investedAmount: z.number().positive(),
    currentValue: z.number().min(0),
    units: z.number().positive().optional(),
    purchaseDate: z.coerce.date(),
    notes: z.string().max(1000).optional(),
  }),
});

export const updateInvestmentSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().min(1).max(120).optional(),
      type: z
        .enum(['mutual_fund', 'stock', 'etf', 'fd', 'gold', 'ppf', 'other'])
        .optional(),
      investedAmount: z.number().positive().optional(),
      currentValue: z.number().min(0).optional(),
      units: z.number().positive().nullable().optional(),
      purchaseDate: z.coerce.date().optional(),
      notes: z.string().max(1000).nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
});

export const investmentIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});
