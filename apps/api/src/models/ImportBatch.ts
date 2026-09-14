import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type ImportBatchSource = 'csv' | 'pdf';
export type ImportBatchStatus = 'pending' | 'preview' | 'reviewing' | 'completed' | 'failed';

export interface ImportStats {
  total: number;
  imported: number;
  duplicates: number;
  rejected: number;
}

export interface ImportBatchAttrs {
  userId: Types.ObjectId;
  source: ImportBatchSource;
  fileName: string;
  status: ImportBatchStatus;
  accountId?: Types.ObjectId;
  headers: string[];
  columnMapping: Record<string, unknown>;
  previewRows: Record<string, unknown>[];
  extractedText?: string;
  stats: ImportStats;
  errorMessage?: string;
}

export interface ImportBatchDocument extends ImportBatchAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IMPORT_SOURCES: ImportBatchSource[] = ['csv', 'pdf'];
const IMPORT_STATUSES: ImportBatchStatus[] = [
  'pending',
  'preview',
  'reviewing',
  'completed',
  'failed',
];

const importStatsSchema = new Schema<ImportStats>(
  {
    total: { type: Number, default: 0 },
    imported: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
  },
  { _id: false }
);

const importBatchSchema = new Schema<ImportBatchDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: { type: String, enum: IMPORT_SOURCES, required: true },
    fileName: { type: String, required: true, trim: true },
    status: { type: String, enum: IMPORT_STATUSES, default: 'pending' },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    headers: { type: [String], default: [] },
    columnMapping: { type: Schema.Types.Mixed, default: {} },
    previewRows: { type: [Schema.Types.Mixed], default: [] },
    extractedText: { type: String },
    stats: {
      type: importStatsSchema,
      default: () => ({ total: 0, imported: 0, duplicates: 0, rejected: 0 }),
    },
    errorMessage: { type: String, trim: true },
  },
  { timestamps: true }
);

export type ImportBatchModel = Model<ImportBatchDocument>;

export const ImportBatch = model<ImportBatchDocument, ImportBatchModel>(
  'ImportBatch',
  importBatchSchema
);
