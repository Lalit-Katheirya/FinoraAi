import { z } from 'zod';

const objectId = z.string().min(1);

export const createGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    targetAmount: z.number().positive(),
    currentAmount: z.number().min(0).default(0),
    targetDate: z.coerce.date(),
    monthlyContribution: z.number().min(0).default(0),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    category: z.string().min(1).max(80),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().min(1).max(120).optional(),
      targetAmount: z.number().positive().optional(),
      currentAmount: z.number().min(0).optional(),
      targetDate: z.coerce.date().optional(),
      monthlyContribution: z.number().min(0).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      category: z.string().min(1).max(80).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
});

export const goalIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});
