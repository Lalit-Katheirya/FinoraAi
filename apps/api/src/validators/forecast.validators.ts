import { z } from 'zod';

export const forecastQuerySchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(1).max(24).default(6),
  }),
});
