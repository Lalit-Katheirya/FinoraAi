import { z } from 'zod';

const objectId = z.string().min(1);

export const categorizeSchema = z.object({
  body: z.object({
    merchant: z.string().min(1).max(160),
    description: z.string().max(500).optional(),
    useAi: z.boolean().optional(),
  }),
});

export const correctionSchema = z.object({
  body: z.object({
    merchant: z.string().min(1).max(160),
    categoryId: objectId.optional(),
    categoryName: z.string().min(1).max(80),
    transactionId: objectId.optional(),
  }),
});
