import { parse } from 'csv-parse/sync';
import { randomUUID } from 'crypto';
import pdfParse from 'pdf-parse';
import { toISODate, type TransactionType } from '@finora/shared';
import { accountRepository } from '../repositories/account.repository';
import {
  importRepository,
  type ImportRow,
} from '../repositories/import.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';
import { buildDuplicateHash } from '../utils/duplicateHash';
import { categorizationService } from './categorization.service';

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const h = normalizeHeader(header);
    if (['date', 'transaction_date', 'txn_date', 'posted_date'].includes(h)) {
      mapping.date = header;
    } else if (['amount', 'amt', 'value', 'debit', 'credit'].includes(h)) {
      mapping.amount = header;
    } else if (['merchant', 'payee', 'narration', 'particulars'].includes(h)) {
      mapping.merchant = header;
    } else if (['description', 'details', 'remarks', 'note'].includes(h)) {
      mapping.description = header;
    } else if (['type', 'txn_type', 'credit_debit'].includes(h)) {
      mapping.type = header;
    } else if (['category', 'category_name'].includes(h)) {
      mapping.categoryName = header;
    }
  }
  return mapping;
}

function parseAmount(raw: string): number | undefined {
  const cleaned = raw.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.abs(value) : undefined;
}

function inferType(raw: string | undefined, amountRaw: string | undefined): TransactionType {
  const t = (raw ?? '').toLowerCase();
  if (t.includes('income') || t.includes('credit') || t.includes('cr')) return 'income';
  if (t.includes('transfer')) return 'transfer';
  if (amountRaw && amountRaw.trim().startsWith('-')) return 'expense';
  return 'expense';
}

function asRows(value: unknown): ImportRow[] {
  if (!Array.isArray(value)) return [];
  return value as ImportRow[];
}

export class ImportService {
  async uploadCsv(userId: string, file: Express.Multer.File) {
    const text = file.buffer.toString('utf8');
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw AppError.badRequest('CSV file has no data rows');
    }

    const headers = Object.keys(records[0]);
    const columnMapping = guessMapping(headers);
    const previewRows: ImportRow[] = records.map((raw) => ({
      rowId: randomUUID(),
      raw,
      status: 'pending',
    }));

    const batch = await importRepository.create({
      userId,
      source: 'csv',
      fileName: file.originalname,
      status: 'pending',
      headers,
      previewRows,
      columnMapping,
      stats: { total: previewRows.length, imported: 0, duplicates: 0, rejected: 0 },
    });

    return {
      id: String(batch._id),
      fileName: file.originalname,
      headers,
      suggestedMapping: columnMapping,
      rowCount: previewRows.length,
      status: batch.status,
    };
  }

  async uploadPdf(userId: string, file: Express.Multer.File) {
    const parsed = await pdfParse(file.buffer);
    const batch = await importRepository.create({
      userId,
      source: 'pdf',
      fileName: file.originalname,
      status: 'pending',
      extractedText: parsed.text,
      previewRows: [],
      headers: [],
    });

    return {
      id: String(batch._id),
      fileName: file.originalname,
      status: batch.status,
      extractedTextPreview: parsed.text.slice(0, 2000),
      note: 'PDF text extraction stub — map transactions manually or use CSV for full import',
    };
  }

  async mapColumns(
    userId: string,
    id: string,
    input: { columnMapping: Record<string, string>; accountId: string }
  ) {
    const batch = await this.requireOwnedBatch(userId, id);
    const account = await accountRepository.findById(input.accountId);
    if (!account) throw AppError.notFound('Account not found');
    assertOwned(String(account.userId), userId);

    const previewRows = asRows(batch.previewRows).map((row) => {
      const mapped = this.mapRow(row.raw, input.columnMapping);
      return {
        ...row,
        ...mapped,
        status: 'pending' as const,
      };
    });

    const updated = await importRepository.update(id, {
      columnMapping: input.columnMapping,
      accountId: input.accountId,
      previewRows,
      status: 'preview',
      stats: {
        total: previewRows.length,
        imported: 0,
        duplicates: 0,
        rejected: 0,
      },
    });

    return this.previewPayload(updated!);
  }

  async preview(userId: string, id: string) {
    const batch = await this.requireOwnedBatch(userId, id);
    return this.previewPayload(batch);
  }

  async validate(userId: string, id: string) {
    const batch = await this.requireOwnedBatch(userId, id);
    if (!batch.accountId) {
      throw AppError.badRequest('Map columns and account before validating');
    }

    const accountId = String(batch.accountId);
    const previewRows = [...asRows(batch.previewRows)];
    const hashes = previewRows
      .map((r) => {
        if (!r.date || r.amount === undefined) return undefined;
        return buildDuplicateHash(r.date, r.amount, r.merchant ?? '', accountId);
      })
      .filter((h): h is string => Boolean(h));

    const existing = await transactionRepository.findByDuplicateHashes(userId, hashes);
    const existingSet = new Set(existing.map((e) => String(e.duplicateHash)));

    let duplicates = 0;
    for (const row of previewRows) {
      const errors: string[] = [];
      if (!row.date) errors.push('date is required');
      if (row.amount === undefined || !Number.isFinite(row.amount)) {
        errors.push('amount is required');
      }
      if (!row.type) errors.push('type is required');

      if (row.date && row.amount !== undefined) {
        const hash = buildDuplicateHash(
          row.date,
          row.amount,
          row.merchant ?? '',
          accountId
        );
        row.duplicateHash = hash;
        if (existingSet.has(hash)) {
          row.status = 'duplicate';
          duplicates += 1;
          errors.push('duplicate transaction detected');
        }
      }

      row.errors = errors;
      if (errors.length === 0 && row.status !== 'duplicate') {
        row.status = 'pending';
      }
    }

    const updated = await importRepository.update(id, {
      previewRows,
      status: 'reviewing',
      stats: {
        total: previewRows.length,
        imported: 0,
        duplicates,
        rejected: 0,
      },
    });

    return this.previewPayload(updated!);
  }

  async editRow(
    userId: string,
    id: string,
    rowId: string,
    patch: Partial<ImportRow>
  ) {
    const batch = await this.requireOwnedBatch(userId, id);
    const previewRows = [...asRows(batch.previewRows)];
    const index = previewRows.findIndex((r) => r.rowId === rowId);
    if (index < 0) throw AppError.notFound('Import row not found');

    previewRows[index] = {
      ...previewRows[index],
      ...patch,
      rowId,
      raw: previewRows[index].raw,
    };

    const updated = await importRepository.update(id, {
      previewRows,
      status: 'reviewing',
    });
    return this.previewPayload(updated!);
  }

  async approve(userId: string, id: string) {
    const batch = await this.requireOwnedBatch(userId, id);
    if (!batch.accountId) {
      throw AppError.badRequest('Account is required before approve');
    }
    const accountId = String(batch.accountId);
    const previewRows = asRows(batch.previewRows);

    const toCommit = previewRows.filter(
      (r) =>
        (r.status === 'approved' || r.status === 'pending') &&
        r.date &&
        r.amount !== undefined &&
        !(r.errors && r.errors.length > 0) &&
        r.status !== 'duplicate'
    );

    const payloads = [];
    for (const row of toCommit) {
      const merchant = row.merchant ?? '';
      const categorized = merchant
        ? await categorizationService.categorize(userId, {
            merchant,
            description: row.description,
            useAi: false,
          })
        : null;

      const duplicateHash =
        row.duplicateHash ??
        buildDuplicateHash(row.date!, row.amount!, merchant, accountId);

      payloads.push({
        userId,
        accountId,
        type: (row.type ?? 'expense') as TransactionType,
        amount: row.amount!,
        currency: 'INR' as const,
        merchant: row.merchant,
        description: row.description,
        categoryName: row.categoryName ?? categorized?.categoryName,
        categoryId: categorized?.categoryId,
        confidenceScore: categorized?.confidenceScore,
        classificationSource: categorized?.classificationSource,
        transactionDate: new Date(row.date!),
        source: 'csv' as const,
        tags: [] as string[],
        isReviewed: false,
        duplicateHash,
      });
    }

    if (payloads.length > 0) {
      await transactionRepository.createMany(payloads);
    }

    const nextRows = previewRows.map((row) =>
      toCommit.some((c) => c.rowId === row.rowId)
        ? { ...row, status: 'approved' as const }
        : row
    );

    const updated = await importRepository.update(id, {
      previewRows: nextRows,
      status: 'completed',
      stats: {
        total: previewRows.length,
        imported: payloads.length,
        duplicates: previewRows.filter((r) => r.status === 'duplicate').length,
        rejected: previewRows.filter((r) => r.status === 'rejected').length,
      },
    });

    return {
      id: String(updated!._id),
      committedCount: payloads.length,
      status: 'completed',
    };
  }

  async reject(userId: string, id: string) {
    const batch = await this.requireOwnedBatch(userId, id);
    const previewRows = asRows(batch.previewRows).map((r) => ({
      ...r,
      status: 'rejected' as const,
    }));
    const updated = await importRepository.update(id, {
      previewRows,
      status: 'failed',
      stats: {
        total: previewRows.length,
        imported: 0,
        duplicates: 0,
        rejected: previewRows.length,
      },
    });
    return {
      id: String(updated!._id),
      status: 'failed',
    };
  }

  private mapRow(
    raw: Record<string, string>,
    mapping: Record<string, string>
  ): Partial<ImportRow> {
    const dateRaw = mapping.date ? raw[mapping.date] : undefined;
    const amountRaw = mapping.amount ? raw[mapping.amount] : undefined;
    const merchant = mapping.merchant ? raw[mapping.merchant] : undefined;
    const description = mapping.description ? raw[mapping.description] : undefined;
    const typeRaw = mapping.type ? raw[mapping.type] : undefined;
    const categoryName = mapping.categoryName
      ? raw[mapping.categoryName]
      : undefined;

    let date: string | undefined;
    if (dateRaw) {
      const parsed = new Date(dateRaw);
      date = Number.isNaN(parsed.getTime()) ? undefined : toISODate(parsed);
    }

    return {
      date,
      amount: amountRaw ? parseAmount(amountRaw) : undefined,
      merchant,
      description,
      type: inferType(typeRaw, amountRaw),
      categoryName,
    };
  }

  private async requireOwnedBatch(userId: string, id: string) {
    const batch = await importRepository.findById(id);
    if (!batch) throw AppError.notFound('Import batch not found');
    assertOwned(String(batch.userId), userId);
    return batch;
  }

  private previewPayload(batch: {
    _id: unknown;
    fileName?: unknown;
    status?: unknown;
    headers?: unknown;
    columnMapping?: unknown;
    accountId?: unknown;
    previewRows?: unknown;
  }) {
    const rows = asRows(batch.previewRows);
    return {
      id: String(batch._id),
      fileName: String(batch.fileName ?? ''),
      status: String(batch.status ?? ''),
      headers: (batch.headers as string[] | undefined) ?? [],
      columnMapping:
        (batch.columnMapping as Record<string, string> | undefined) ?? {},
      accountId: batch.accountId ? String(batch.accountId) : undefined,
      rows,
      summary: {
        total: rows.length,
        pending: rows.filter((r) => r.status === 'pending').length,
        approved: rows.filter((r) => r.status === 'approved').length,
        rejected: rows.filter((r) => r.status === 'rejected').length,
        duplicate: rows.filter((r) => r.status === 'duplicate').length,
      },
    };
  }
}

export const importService = new ImportService();
