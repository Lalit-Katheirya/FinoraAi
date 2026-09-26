import { Schema, model, type Model, type Types, type Document } from 'mongoose';
import type { CurrencyCode } from '@finora/shared';
import { DEFAULT_CURRENCY } from '@finora/shared';

export interface RefreshTokenDoc {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface UserAttrs {
  name: string;
  email: string;
  passwordHash: string;
  currency: CurrencyCode;
  timezone: string;
  monthlyIncome?: number;
  financialPreferences?: Record<string, unknown>;
  isDemo?: boolean;
  refreshTokens: RefreshTokenDoc[];
}

export interface UserDocument extends UserAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
      default: DEFAULT_CURRENCY,
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    monthlyIncome: { type: Number, min: 0 },
    financialPreferences: { type: Schema.Types.Mixed, default: {} },
    isDemo: { type: Boolean, default: false },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
  },
  { timestamps: true }
);

export type UserModel = Model<UserDocument>;

export const User = model<UserDocument, UserModel>('User', userSchema);
