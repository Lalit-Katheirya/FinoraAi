import { z } from 'zod';

export const detectRecurringSchema = z.object({
  query: z.object({
    minOccurrences: z.coerce.number().int().min(2).max(24).default(3),
    lookbackDays: z.coerce.number().int().min(30).max(365).default(180),
  }),
});
