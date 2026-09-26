import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type {
  ClassificationSource,
  CurrencyCode,
  ImportSource,
  PaymentMethod,
  TransactionType,
} from '@finora/shared';
import { DEFAULT_CURRENCY } from '@finora/shared';

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense', 'transfer'];
const PAYMENT_METHODS: PaymentMethod[] = [
  'upi',
  'card',
  'netbanking',
  'cash',
  'cheque',
  'other',
];
const IMPORT_SOURCES: ImportSource[] = ['csv', 'pdf', 'manual', 'api'];
const CLASSIFICATION_SOURCES: ClassificationSource[] = ['rule', 'ai', 'manual'];

export interface TransactionAttrs {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  categoryId?: Types.ObjectId;
  categoryName?: string;
  subCategory?: string;
  merchant?: string;
  description?: string;
  transactionDate: Date;
  paymentMethod?: PaymentMethod;
  source: ImportSource;
  tags: string[];
  notes?: string;
  confidenceScore?: number;
  classificationSource?: ClassificationSource;
  isReviewed: boolean;
  importId?: Types.ObjectId;
  duplicateHash?: string;
}

export interface TransactionDocument extends TransactionAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
      default: DEFAULT_CURRENCY,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    categoryName: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    merchant: { type: String, trim: true },
    description: { type: String, trim: true },
    transactionDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS },
    source: { type: String, enum: IMPORT_SOURCES, default: 'manual' },
    tags: { type: [String], default: [] },
    notes: { type: String, trim: true },
    confidenceScore: { type: Number, min: 0, max: 1 },
    classificationSource: { type: String, enum: CLASSIFICATION_SOURCES },
    isReviewed: { type: Boolean, default: false },
    importId: { type: Schema.Types.ObjectId, ref: 'ImportBatch' },
    duplicateHash: { type: String, index: true },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, accountId: 1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, duplicateHash: 1 });

export type TransactionModel = Model<TransactionDocument>;

export const Transaction = model<TransactionDocument, TransactionModel>(
  'Transaction',
  transactionSchema
);
