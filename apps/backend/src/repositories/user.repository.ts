import type { CurrencyCode } from '@finora/shared';
import { User, type UserDocument, type RefreshTokenDoc } from '../models/User';

export type UserWithPassword = UserDocument & { passwordHash: string };

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  currency?: CurrencyCode;
  timezone?: string;
}

export async function findByEmail(email: string): Promise<UserDocument | null> {
  return User.findOne({ email: email.toLowerCase() });
}

export async function findByEmailWithPassword(
  email: string
): Promise<UserWithPassword | null> {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  return user as UserWithPassword | null;
}

export async function findById(id: string): Promise<UserDocument | null> {
  return User.findById(id);
}

export async function findByIdWithPassword(id: string): Promise<UserWithPassword | null> {
  const user = await User.findById(id).select('+passwordHash');
  return user as UserWithPassword | null;
}

export async function createUser(input: CreateUserInput): Promise<UserDocument> {
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    currency: input.currency,
    timezone: input.timezone,
  });
  return user;
}

export async function addRefreshToken(
  userId: string,
  token: RefreshTokenDoc
): Promise<void> {
  await User.updateOne({ _id: userId }, { $push: { refreshTokens: token } });
}

export async function removeRefreshToken(
  userId: string,
  tokenHash: string
): Promise<void> {
  await User.updateOne({ _id: userId }, { $pull: { refreshTokens: { tokenHash } } });
}

export async function clearRefreshTokens(userId: string): Promise<void> {
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
}

export async function findByRefreshTokenHash(
  tokenHash: string
): Promise<UserDocument | null> {
  return User.findOne({ 'refreshTokens.tokenHash': tokenHash });
}

export async function updatePasswordHash(
  userId: string,
  passwordHash: string
): Promise<void> {
  await User.updateOne({ _id: userId }, { $set: { passwordHash } });
}

export async function updateProfile(
  userId: string,
  patch: {
    name?: string;
    currency?: CurrencyCode;
    timezone?: string;
    monthlyIncome?: number | null;
  }
): Promise<UserDocument | null> {
  const $set: Record<string, unknown> = {};
  if (patch.name !== undefined) $set.name = patch.name;
  if (patch.currency !== undefined) $set.currency = patch.currency;
  if (patch.timezone !== undefined) $set.timezone = patch.timezone;
  if (patch.monthlyIncome !== undefined) {
    $set.monthlyIncome = patch.monthlyIncome === null ? undefined : patch.monthlyIncome;
  }

  return User.findByIdAndUpdate(userId, { $set }, { new: true });
}

export async function updateAvatarUrl(
  userId: string,
  avatarUrl: string | null
): Promise<UserDocument | null> {
  if (avatarUrl === null) {
    return User.findByIdAndUpdate(userId, { $unset: { avatarUrl: 1 } }, { new: true });
  }
  return User.findByIdAndUpdate(userId, { $set: { avatarUrl } }, { new: true });
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await User.deleteOne({ _id: userId });
  return result.deletedCount === 1;
}
