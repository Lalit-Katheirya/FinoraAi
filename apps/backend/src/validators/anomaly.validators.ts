import { z } from 'zod';

export const anomalyQuerySchema = z.object({
  query: z.object({
    lookbackDays: z.coerce.number().int().min(30).max(365).default(90),
    zThreshold: z.coerce.number().min(1).max(5).default(2),
  }),
});
