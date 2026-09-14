import { createHash, randomBytes } from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Response } from 'express';
import type { CurrencyCode, UserDto } from '@finora/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';
import type { UserDocument } from '../models/User';
import * as userRepository from '../repositories/user.repository';

const REFRESH_COOKIE = 'finora_refresh';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function refreshCookieOptions(): {
  httpOnly: boolean;
  sameSite: 'lax' | 'none' | 'strict';
  secure: boolean;
  path: string;
  maxAge?: number;
} {
  // Cross-origin SPA (e.g. Angular :4200 → API :4000) needs SameSite=None; Secure.
  // Chrome treats http://localhost as a secure context, so Secure works without HTTPS.
  let sameSite: 'lax' | 'none' | 'strict' = 'lax';
  let secure = Boolean(env.COOKIE_SECURE);

  try {
    const front = new URL(env.FRONTEND_URL);
    const frontPort = front.port || (front.protocol === 'https:' ? '443' : '80');
    const apiPort = String(env.PORT);
    const crossOriginLocal =
      (front.hostname === 'localhost' || front.hostname === '127.0.0.1') &&
      frontPort !== apiPort;

    if (env.COOKIE_SECURE || crossOriginLocal) {
      sameSite = 'none';
      secure = true;
    }
  } catch {
    if (env.COOKIE_SECURE) {
      sameSite = 'none';
      secure = true;
    }
  }

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: '/api/auth',
    maxAge: REFRESH_MAX_AGE_MS,
  };
}

export interface AuthResult {
  user: UserDto;
  accessToken: string;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
}

interface RefreshTokenPayload {
  sub: string;
  email: string;
  type: 'refresh';
  jti: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_MAX_AGE_MS);
}

function signAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = { sub: userId, email, type: 'access' };
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

function signRefreshToken(userId: string, email: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    email,
    type: 'refresh',
    jti: randomBytes(16).toString('hex'),
  };
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

function toUserDto(user: UserDocument): UserDto {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    currency: user.currency,
    timezone: user.timezone,
    monthlyIncome: user.monthlyIncome,
    financialPreferences: user.financialPreferences,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  const { maxAge, ...base } = refreshCookieOptions();
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge });
}

export function clearRefreshCookie(res: Response): void {
  const { maxAge: _maxAge, ...base } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, base);
}

export function getRefreshCookieName(): string {
  return REFRESH_COOKIE;
}

async function issueTokens(
  user: UserDocument
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken(user._id.toString(), user.email);
  const refreshToken = signRefreshToken(user._id.toString(), user.email);
  const tokenHash = hashToken(refreshToken);

  await userRepository.addRefreshToken(user._id.toString(), {
    tokenHash,
    expiresAt: getRefreshExpiryDate(),
    createdAt: new Date(),
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  currency?: CurrencyCode;
  timezone?: string;
}): Promise<AuthResult & { refreshToken: string }> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw AppError.conflict('Email is already registered');
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await userRepository.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    currency: input.currency,
    timezone: input.timezone,
  });

  const tokens = await issueTokens(user);
  logger.info({ userId: user._id.toString(), action: 'register' }, 'User registered');

  return {
    user: toUserDto(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult & { refreshToken: string }> {
  const user = await userRepository.findByEmailWithPassword(input.email);
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const valid = await argon2.verify(user.passwordHash, input.password);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const tokens = await issueTokens(user);
  logger.info({ userId: user._id.toString(), action: 'login' }, 'User logged in');

  return {
    user: toUserDto(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function logout(userId: string | undefined, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    if (userId) {
      await userRepository.removeRefreshToken(userId, tokenHash);
    } else {
      const user = await userRepository.findByRefreshTokenHash(tokenHash);
      if (user) {
        await userRepository.removeRefreshToken(user._id.toString(), tokenHash);
      }
    }
  }
  logger.info({ userId, action: 'logout' }, 'User logged out');
}

export async function refresh(
  refreshToken: string | undefined
): Promise<AuthResult & { refreshToken: string }> {
  if (!refreshToken) {
    throw AppError.unauthorized('Refresh token missing');
  }

  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh' || !payload.sub) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const user = await userRepository.findByRefreshTokenHash(tokenHash);
  if (!user || user._id.toString() !== payload.sub) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  const stored = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    await userRepository.removeRefreshToken(user._id.toString(), tokenHash);
    throw AppError.unauthorized('Refresh token expired');
  }

  await userRepository.removeRefreshToken(user._id.toString(), tokenHash);
  const tokens = await issueTokens(user);

  return {
    user: toUserDto(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function me(userId: string): Promise<UserDto> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return toUserDto(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const valid = await argon2.verify(user.passwordHash, currentPassword);
  if (!valid) {
    throw AppError.unauthorized('Current password is incorrect');
  }

  const passwordHash = await argon2.hash(newPassword);
  await userRepository.updatePasswordHash(userId, passwordHash);
  await userRepository.clearRefreshTokens(userId);
  logger.info({ userId, action: 'changePassword' }, 'Password changed');
}

export async function deleteAccount(userId: string): Promise<void> {
  const deleted = await userRepository.deleteUser(userId);
  if (!deleted) {
    throw AppError.notFound('User not found');
  }
  logger.info({ userId, action: 'deleteAccount' }, 'Account deleted');
}

export function verifyAccessToken(token: string): { id: string; email: string } {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access' || !decoded.sub || !decoded.email) {
      throw AppError.unauthorized('Invalid access token');
    }
    return { id: decoded.sub, email: decoded.email };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.unauthorized('Invalid or expired access token');
  }
}
