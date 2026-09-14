import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../services/auth.service';

export interface AuthUser {
  id: string;
  email: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw AppError.unauthorized('Missing access token');
    }

    const user = verifyAccessToken(token);
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireUser(req: Request): AuthUser {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }
  return req.user;
}
