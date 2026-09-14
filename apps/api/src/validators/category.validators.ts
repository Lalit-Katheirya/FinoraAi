import { z } from 'zod';

const objectId = z.string().min(1);

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80),
    icon: z.string().max(40).optional(),
    color: z.string().max(20).optional(),
    parentId: objectId.optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().min(1).max(80).optional(),
      icon: z.string().max(40).optional(),
      color: z.string().max(20).optional(),
      parentId: objectId.nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});
