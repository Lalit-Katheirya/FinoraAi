import { z } from 'zod';

const objectId = z.string().min(1);

export const insightIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listInsightsSchema = z.object({
  query: z.object({
    unreadOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  }),
});
