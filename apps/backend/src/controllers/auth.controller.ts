import type { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendMessage } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import * as authService from '../services/auth.service';
import type {
  RegisterBody,
  LoginBody,
  ChangePasswordBody,
} from '../validators/auth.validators';

function getRefreshToken(req: Request): string | undefined {
  const value = req.cookies?.[authService.getRefreshCookieName()];
  return typeof value === 'string' ? value : undefined;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as RegisterBody;
    const result = await authService.register(body);
    authService.setRefreshCookie(res, result.refreshToken);
    sendSuccess(
      res,
      { user: result.user, accessToken: result.accessToken },
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as LoginBody;
    const result = await authService.login(body);
    authService.setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.logout(req.user?.id, getRefreshToken(req));
    authService.clearRefreshCookie(res);
    sendMessage(res, 'Logged out');
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.refresh(getRefreshToken(req));
    authService.setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken });
  } catch (err) {
    authService.clearRefreshCookie(res);
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const user = await authService.me(req.user.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const body = req.body as ChangePasswordBody;
    await authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword
    );
    authService.clearRefreshCookie(res);
    sendMessage(res, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    await authService.deleteAccount(req.user.id);
    authService.clearRefreshCookie(res);
    sendMessage(res, 'Account deleted');
  } catch (err) {
    next(err);
  }
}
