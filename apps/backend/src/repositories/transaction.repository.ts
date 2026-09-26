import type {
  ClassificationSource,
  CurrencyCode,
  ImportSource,
  PaymentMethod,
  TransactionType,
} from '@finora/shared';
import type { FilterQuery, SortOrder } from 'mongoose';
import { Transaction } from '../models';
import { toObjectId } from '../utils/objectId';

export interface CreateTransactionInput {
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  categoryId?: string;
  categoryName?: string;
  subCategory?: string;
  merchant?: string;
  description?: string;
  transactionDate: Date;
  paymentMethod?: PaymentMethod;
  source?: ImportSource;
  tags?: string[];
  notes?: string;
  confidenceScore?: number;
  classificationSource?: ClassificationSource;
  isReviewed?: boolean;
  duplicateHash?: string;
}

export interface UpdateTransactionInput {
  accountId?: string;
  type?: TransactionType;
  amount?: number;
  currency?: CurrencyCode;
  categoryId?: string | null;
  categoryName?: string | null;
  subCategory?: string | null;
  merchant?: string | null;
  description?: string | null;
  transactionDate?: Date;
  paymentMethod?: PaymentMethod | null;
  tags?: string[];
  notes?: string | null;
  isReviewed?: boolean;
  confidenceScore?: number;
  classificationSource?: ClassificationSource;
  duplicateHash?: string;
}

export interface TransactionSearchFilter {
  userId: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  q?: string;
}

export class TransactionRepository {
  buildFilter(filter: TransactionSearchFilter): FilterQuery<Record<string, unknown>> {
    const query: FilterQuery<Record<string, unknown>> = { userId: filter.userId };

    if (filter.accountId) query.accountId = filter.accountId;
    if (filter.categoryId) query.categoryId = filter.categoryId;
    if (filter.type) query.type = filter.type;

    if (filter.dateFrom || filter.dateTo) {
      query.transactionDate = {
        ...(filter.dateFrom ? { $gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { $lte: filter.dateTo } : {}),
      };
    }

    if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
      query.amount = {
        ...(filter.minAmount !== undefined ? { $gte: filter.minAmount } : {}),
        ...(filter.maxAmount !== undefined ? { $lte: filter.maxAmount } : {}),
      };
    }

    if (filter.q) {
      const regex = new RegExp(filter.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { merchant: regex },
        { description: regex },
        { notes: regex },
        { categoryName: regex },
        { tags: regex },
      ];
    }

    return query;
  }

  async search(
    filter: TransactionSearchFilter,
    options: {
      skip: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    }
  ) {
    const query = this.buildFilter(filter);
    const sort: Record<string, SortOrder> = {
      [options.sortBy]: options.sortOrder === 'asc' ? 1 : -1,
    };

    const [items, total] = await Promise.all([
      Transaction.find(query).sort(sort).skip(options.skip).limit(options.limit).exec(),
      Transaction.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return Transaction.findById(id).exec();
  }

  async create(data: CreateTransactionInput) {
    return Transaction.create(data);
  }

  async createMany(data: CreateTransactionInput[]) {
    return Transaction.insertMany(data, { ordered: false });
  }

  async update(id: string, data: UpdateTransactionInput) {
    return Transaction.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string) {
    return Transaction.findByIdAndDelete(id).exec();
  }

  async findByDuplicateHashes(userId: string, hashes: string[]) {
    if (hashes.length === 0) return [];
    return Transaction.find({
      userId,
      duplicateHash: { $in: hashes },
    })
      .select('duplicateHash')
      .lean()
      .exec();
  }

  async sumByType(
    userId: string,
    type: TransactionType,
    dateFrom: Date,
    dateTo: Date
  ): Promise<number> {
    const result = await Transaction.aggregate<{ total: number }>([
      {
        $match: {
          userId: toObjectId(userId),
          type,
          transactionDate: { $gte: dateFrom, $lte: dateTo },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async sumExpensesByCategory(
    userId: string,
    categoryId: string | undefined,
    dateFrom: Date,
    dateTo: Date
  ): Promise<number> {
    const match: Record<string, unknown> = {
      userId: toObjectId(userId),
      type: 'expense',
      transactionDate: { $gte: dateFrom, $lte: dateTo },
    };
    if (categoryId) {
      match.categoryId = toObjectId(categoryId);
    }

    const result = await Transaction.aggregate<{ total: number }>([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async findRecent(userId: string, limit = 10) {
    return Transaction.find({ userId })
      .sort({ transactionDate: -1 })
      .limit(limit)
      .exec();
  }

  async findInDateRange(userId: string, dateFrom: Date, dateTo: Date) {
    return Transaction.find({
      userId,
      transactionDate: { $gte: dateFrom, $lte: dateTo },
    })
      .sort({ transactionDate: 1 })
      .exec();
  }

  async findSince(userId: string, dateFrom: Date) {
    return Transaction.find({
      userId,
      transactionDate: { $gte: dateFrom },
    })
      .sort({ transactionDate: 1 })
      .exec();
  }
}

export const transactionRepository = new TransactionRepository();
