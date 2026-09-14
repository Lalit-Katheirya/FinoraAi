import type { Response } from 'express';
import type { PaginationMeta } from '@finora/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: PaginationMeta
): void {
  res.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendMessage(res: Response, message: string, status = 200): void {
  res.status(status).json({
    success: true,
    data: { message },
  });
}
