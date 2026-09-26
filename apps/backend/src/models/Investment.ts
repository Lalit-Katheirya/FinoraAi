import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { InvestmentType } from '@finora/shared';

const INVESTMENT_TYPES: InvestmentType[] = [
  'mutual_fund',
  'stock',
  'etf',
  'fd',
  'gold',
  'ppf',
  'other',
];

export interface InvestmentAttrs {
  userId: Types.ObjectId;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  units?: number;
  purchaseDate: Date;
  notes?: string;
}

export interface InvestmentDocument extends InvestmentAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const investmentSchema = new Schema<InvestmentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: INVESTMENT_TYPES, required: true },
    investedAmount: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
    units: { type: Number, min: 0 },
    purchaseDate: { type: Date, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export type InvestmentModel = Model<InvestmentDocument>;

export const Investment = model<InvestmentDocument, InvestmentModel>(
  'Investment',
  investmentSchema
);
