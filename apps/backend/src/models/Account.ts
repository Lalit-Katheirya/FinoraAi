import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { AccountType, CurrencyCode } from '@finora/shared';
import { DEFAULT_CURRENCY } from '@finora/shared';

const ACCOUNT_TYPES: AccountType[] = [
  'bank',
  'cash',
  'credit_card',
  'debit',
  'wallet',
  'investment',
];

export interface AccountAttrs {
  userId: Types.ObjectId;
  name: string;
  type: AccountType;
  institution?: string;
  accountNumberMasked?: string;
  currentBalance: number;
  availableBalance: number;
  currency: CurrencyCode;
  isActive: boolean;
}

export interface AccountDocument extends AccountAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<AccountDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    institution: { type: String, trim: true },
    accountNumberMasked: { type: String, trim: true },
    currentBalance: { type: Number, required: true, default: 0 },
    availableBalance: { type: Number, required: true, default: 0 },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
      default: DEFAULT_CURRENCY,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1, isActive: 1 });

export type AccountModel = Model<AccountDocument>;

export const Account = model<AccountDocument, AccountModel>('Account', accountSchema);
