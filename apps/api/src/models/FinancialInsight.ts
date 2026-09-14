import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { InsightSeverity } from '@finora/shared';

const SEVERITIES: InsightSeverity[] = ['info', 'success', 'warning', 'critical'];

export interface FinancialInsightAttrs {
  userId: Types.ObjectId;
  title: string;
  message: string;
  severity: InsightSeverity;
  category?: string;
  expiresAt?: Date;
  isRead: boolean;
}

export interface FinancialInsightDocument extends FinancialInsightAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const financialInsightSchema = new Schema<FinancialInsightDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    severity: { type: String, enum: SEVERITIES, default: 'info' },
    category: { type: String, trim: true },
    expiresAt: { type: Date },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type FinancialInsightModel = Model<FinancialInsightDocument>;

export const FinancialInsight = model<FinancialInsightDocument, FinancialInsightModel>(
  'FinancialInsight',
  financialInsightSchema
);
