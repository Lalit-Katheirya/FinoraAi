import type { TransactionDto } from '@finora/shared';
import { toISODate } from '@finora/shared';
import { accountRepository } from '../repositories/account.repository';
import {
  transactionRepository,
  type CreateTransactionInput,
  type TransactionSearchFilter,
  type UpdateTransactionInput,
} from '../repositories/transaction.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';
import { buildDuplicateHash } from '../utils/duplicateHash';
import { toTransactionDto } from '../utils/mappers';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { categorizationService } from './categorization.service';

export class TransactionService {
  async list(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      accountId?: string;
      categoryId?: string;
      type?: 'income' | 'expense' | 'transfer';
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
      q?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);
    const filter: TransactionSearchFilter = {
      userId,
      accountId: query.accountId,
      categoryId: query.categoryId,
      type: query.type,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      q: query.q,
    };

    const { items, total } = await transactionRepository.search(filter, {
      skip,
      limit,
      sortBy: query.sortBy ?? 'transactionDate',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: items.map((t) => toTransactionDto(t as never) as TransactionDto),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(userId: string, id: string): Promise<TransactionDto> {
    const tx = await transactionRepository.findById(id);
    if (!tx) throw AppError.notFound('Transaction not found');
    assertOwned(String(tx.userId), userId);
    return toTransactionDto(tx as never) as TransactionDto;
  }

  async create(
    userId: string,
    input: Omit<CreateTransactionInput, 'userId' | 'source' | 'duplicateHash'>
  ): Promise<TransactionDto> {
    const account = await accountRepository.findById(input.accountId);
    if (!account) throw AppError.notFound('Account not found');
    assertOwned(String(account.userId), userId);

    const merchant = input.merchant ?? '';
    const dateStr = toISODate(input.transactionDate);
    const duplicateHash = buildDuplicateHash(
      dateStr,
      input.amount,
      merchant,
      input.accountId
    );

    let categoryId = input.categoryId;
    let categoryName = input.categoryName;
    let confidenceScore = input.confidenceScore;
    let classificationSource = input.classificationSource;

    if (!categoryId && !categoryName && merchant) {
      const categorized = await categorizationService.categorize(userId, {
        merchant,
        description: input.description,
        useAi: false,
      });
      if (categorized) {
        categoryId = categorized.categoryId;
        categoryName = categorized.categoryName;
        confidenceScore = categorized.confidenceScore;
        classificationSource = categorized.classificationSource;
      }
    }

    const created = await transactionRepository.create({
      ...input,
      userId,
      categoryId,
      categoryName,
      confidenceScore,
      classificationSource,
      source: 'manual',
      duplicateHash,
      isReviewed: input.isReviewed ?? false,
    });

    return toTransactionDto(created as never) as TransactionDto;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateTransactionInput
  ): Promise<TransactionDto> {
    const tx = await transactionRepository.findById(id);
    if (!tx) throw AppError.notFound('Transaction not found');
    assertOwned(String(tx.userId), userId);

    if (input.accountId) {
      const account = await accountRepository.findById(input.accountId);
      if (!account) throw AppError.notFound('Account not found');
      assertOwned(String(account.userId), userId);
    }

    const amount = input.amount ?? Number(tx.amount);
    const merchant = input.merchant ?? (tx.merchant as string | undefined) ?? '';
    const accountId = input.accountId ?? String(tx.accountId);
    const date =
      input.transactionDate ??
      (tx.transactionDate instanceof Date
        ? tx.transactionDate
        : new Date(String(tx.transactionDate)));

    const duplicateHash = buildDuplicateHash(
      toISODate(date),
      amount,
      merchant,
      accountId
    );

    const updated = await transactionRepository.update(id, {
      ...input,
      duplicateHash,
    });
    if (!updated) throw AppError.notFound('Transaction not found');
    return toTransactionDto(updated as never) as TransactionDto;
  }

  async remove(userId: string, id: string): Promise<void> {
    const tx = await transactionRepository.findById(id);
    if (!tx) throw AppError.notFound('Transaction not found');
    assertOwned(String(tx.userId), userId);
    await transactionRepository.delete(id);
  }
}

export const transactionService = new TransactionService();
