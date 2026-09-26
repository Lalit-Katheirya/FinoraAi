import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { BudgetPeriod, CurrencyCode } from '@finora/shared';
import { BUDGET_ALERT_THRESHOLDS, DEFAULT_CURRENCY } from '@finora/shared';

const BUDGET_PERIODS: BudgetPeriod[] = ['monthly', 'annual', 'category'];

export interface BudgetAttrs {
  userId: Types.ObjectId;
  name: string;
  period: BudgetPeriod;
  categoryId?: Types.ObjectId;
  amount: number;
  currency: CurrencyCode;
  startDate: Date;
  endDate: Date;
  alertThresholds: number[];
  lastAlertLevel?: number;
}

export interface BudgetDocument extends BudgetAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<BudgetDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    period: { type: String, enum: BUDGET_PERIODS, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    amount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
      default: DEFAULT_CURRENCY,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    alertThresholds: {
      type: [Number],
      default: [...BUDGET_ALERT_THRESHOLDS],
    },
    lastAlertLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type BudgetModel = Model<BudgetDocument>;

export const Budget = model<BudgetDocument, BudgetModel>('Budget', budgetSchema);
