import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const FREQUENCIES: RecurringFrequency[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

export interface RecurringExpenseAttrs {
  userId: Types.ObjectId;
  merchant: string;
  categoryId?: Types.ObjectId;
  frequency: RecurringFrequency;
  averageAmount: number;
  nextExpectedDate: Date;
  lastAmount?: number;
  occurrenceCount: number;
  isActive: boolean;
  sampleTransactionIds: Types.ObjectId[];
}

export interface RecurringExpenseDocument extends RecurringExpenseAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recurringExpenseSchema = new Schema<RecurringExpenseDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchant: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    frequency: { type: String, enum: FREQUENCIES, required: true },
    averageAmount: { type: Number, required: true, min: 0 },
    nextExpectedDate: { type: Date, required: true },
    lastAmount: { type: Number, min: 0 },
    occurrenceCount: { type: Number, required: true, default: 1, min: 0 },
    isActive: { type: Boolean, default: true },
    sampleTransactionIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
      default: [],
    },
  },
  { timestamps: true }
);

export type RecurringExpenseModel = Model<RecurringExpenseDocument>;

export const RecurringExpense = model<RecurringExpenseDocument, RecurringExpenseModel>(
  'RecurringExpense',
  recurringExpenseSchema
);
