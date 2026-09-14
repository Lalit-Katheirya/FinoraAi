import type { ImportBatchSource, ImportBatchStatus, ImportStats } from '../models/ImportBatch';
import { ImportBatch } from '../models';
import type { TransactionType } from '@finora/shared';

export type ImportRowStatus = 'pending' | 'approved' | 'rejected' | 'duplicate';

export interface ImportRow {
  rowId: string;
  date?: string;
  amount?: number;
  merchant?: string;
  description?: string;
  type?: TransactionType;
  categoryName?: string;
  raw: Record<string, string>;
  status: ImportRowStatus;
  duplicateHash?: string;
  errors?: string[];
}

export interface CreateImportBatchInput {
  userId: string;
  source: ImportBatchSource;
  fileName: string;
  status?: ImportBatchStatus;
  headers?: string[];
  previewRows?: ImportRow[];
  columnMapping?: Record<string, string>;
  accountId?: string;
  extractedText?: string;
  stats?: Partial<ImportStats>;
}

export class ImportRepository {
  async create(data: CreateImportBatchInput) {
    return ImportBatch.create({
      userId: data.userId,
      source: data.source,
      fileName: data.fileName,
      status: data.status ?? 'pending',
      headers: data.headers ?? [],
      previewRows: data.previewRows ?? [],
      columnMapping: data.columnMapping ?? {},
      accountId: data.accountId,
      extractedText: data.extractedText,
      stats: {
        total: data.stats?.total ?? data.previewRows?.length ?? 0,
        imported: data.stats?.imported ?? 0,
        duplicates: data.stats?.duplicates ?? 0,
        rejected: data.stats?.rejected ?? 0,
      },
    });
  }

  async findById(id: string) {
    return ImportBatch.findById(id).exec();
  }

  async findByUser(userId: string) {
    return ImportBatch.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async update(
    id: string,
    data: Partial<{
      status: ImportBatchStatus;
      columnMapping: Record<string, string>;
      accountId: string;
      previewRows: ImportRow[];
      headers: string[];
      extractedText: string;
      stats: ImportStats;
      errorMessage: string;
    }>
  ) {
    return ImportBatch.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }
}

export const importRepository = new ImportRepository();
