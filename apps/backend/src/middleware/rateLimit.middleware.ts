import rateLimit from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

function createLimiter(max: number) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(AppError.tooMany('Too many requests, please try again later'));
    },
  });
}

export const apiRateLimiter = createLimiter(env.RATE_LIMIT_MAX);
export const authRateLimiter = createLimiter(env.AUTH_RATE_LIMIT_MAX);
