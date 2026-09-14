import { z } from 'zod';

const objectId = z.string().min(1);

export const importMapSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    columnMapping: z.record(z.string(), z.string()),
    accountId: objectId,
  }),
});

export const importIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const importRowEditSchema = z.object({
  params: z.object({
    id: objectId,
    rowId: z.string().min(1),
  }),
  body: z.object({
    date: z.string().optional(),
    amount: z.number().optional(),
    merchant: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    categoryName: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});
