import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Credential loading order (first file wins for each key; process.env always wins):
 * 1. Existing process.env (Docker / K8s / CI secrets)
 * 2. .env next to cwd
 * 3. Monorepo root .env (../../.env from apps/backend)
 * 4. Dist-relative monorepo root (../../../.env from apps/backend/dist/config)
 */
function loadDotEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file, override: false });
    }
  }
}

loadDotEnvFiles();

const weakSecretPatterns = [
  /change_me/i,
  /finora_dev_/i,
  /your[_-]?secret/i,
  /replace[_-]?me/i,
  /^test/i,
  /^secret$/i,
];

function isWeakSecret(value: string): boolean {
  if (value.length < 32) return true;
  return weakSecretPatterns.some((re) => re.test(value));
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: z.string().default('15m'),
    JWT_REFRESH_EXPIRES: z.string().default('7d'),
    /** Comma-separated origins, e.g. https://app.example.com,http://localhost:4200 */
    FRONTEND_URL: z.string().default('http://localhost:4200'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    COOKIE_SECURE: z
      .string()
      .optional()
      .transform((v) => {
        if (v === undefined || v === '') return undefined;
        return v === 'true';
      }),
    LOG_LEVEL: z.string().default('info'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') return;

    if (isWeakSecret(data.JWT_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'Production requires a strong JWT_SECRET (≥32 chars, not a placeholder)',
      });
    }
    if (isWeakSecret(data.JWT_REFRESH_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'Production requires a strong JWT_REFRESH_SECRET (≥32 chars, not a placeholder)',
      });
    }
    if (data.JWT_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_SECRET and JWT_REFRESH_SECRET must be different in production',
      });
    }
    if (data.MONGODB_URI.includes('127.0.0.1') || data.MONGODB_URI.includes('localhost')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message: 'Production should use a managed MongoDB URI (not localhost)',
      });
    }
  });

export type Env = z.infer<typeof envSchema> & {
  cookieSecure: boolean;
  frontendOrigins: string[];
};

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  const data = parsed.data;
  const frontendOrigins = data.FRONTEND_URL.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const cookieSecure =
    data.COOKIE_SECURE !== undefined
      ? data.COOKIE_SECURE
      : data.NODE_ENV === 'production';

  return {
    ...data,
    cookieSecure,
    frontendOrigins,
  };
}

export const env = loadEnv();
