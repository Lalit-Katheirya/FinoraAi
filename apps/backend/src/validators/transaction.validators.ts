import { z } from 'zod';

const objectId = z.string().min(1);

export const createTransactionSchema = z.object({
  body: z.object({
    accountId: objectId,
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().positive(),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']).default('INR'),
    categoryId: objectId.optional(),
    categoryName: z.string().max(80).optional(),
    subCategory: z.string().max(80).optional(),
    merchant: z.string().max(160).optional(),
    description: z.string().max(500).optional(),
    transactionDate: z.coerce.date(),
    paymentMethod: z
      .enum(['upi', 'card', 'netbanking', 'cash', 'cheque', 'other'])
      .optional(),
    tags: z.array(z.string().max(40)).max(20).default([]),
    notes: z.string().max(1000).optional(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      accountId: objectId.optional(),
      type: z.enum(['income', 'expense', 'transfer']).optional(),
      amount: z.number().positive().optional(),
      currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']).optional(),
      categoryId: objectId.nullable().optional(),
      categoryName: z.string().max(80).nullable().optional(),
      subCategory: z.string().max(80).nullable().optional(),
      merchant: z.string().max(160).nullable().optional(),
      description: z.string().max(500).nullable().optional(),
      transactionDate: z.coerce.date().optional(),
      paymentMethod: z
        .enum(['upi', 'card', 'netbanking', 'cash', 'cheque', 'other'])
        .nullable()
        .optional(),
      tags: z.array(z.string().max(40)).max(20).optional(),
      notes: z.string().max(1000).nullable().optional(),
      isReviewed: z.boolean().optional(),
      confidenceScore: z.number().min(0).max(1).optional(),
      classificationSource: z.enum(['rule', 'ai', 'manual']).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
});

export const transactionIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    accountId: objectId.optional(),
    categoryId: objectId.optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    minAmount: z.coerce.number().optional(),
    maxAmount: z.coerce.number().optional(),
    q: z.string().max(200).optional(),
    sortBy: z
      .enum(['transactionDate', 'amount', 'merchant', 'createdAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
