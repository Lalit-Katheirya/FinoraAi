import { z } from 'zod';
import type { CurrencyCode } from '@finora/shared';

const currencyEnum = z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'] as [
  CurrencyCode,
  ...CurrencyCode[],
]);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
    currency: currencyEnum.optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];
