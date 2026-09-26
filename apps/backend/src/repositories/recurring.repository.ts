import { RecurringExpense } from '../models';

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface UpsertRecurringInput {
  userId: string;
  merchant: string;
  categoryId?: string;
  frequency: RecurringFrequency;
  averageAmount: number;
  nextExpectedDate: Date;
  lastAmount?: number;
  occurrenceCount: number;
  isActive?: boolean;
}

export class RecurringRepository {
  async findByUser(userId: string, activeOnly = true) {
    const filter: Record<string, unknown> = { userId };
    if (activeOnly) filter.isActive = true;
    return RecurringExpense.find(filter).sort({ nextExpectedDate: 1 }).exec();
  }

  async findById(id: string) {
    return RecurringExpense.findById(id).exec();
  }

  async upsertByMerchant(data: UpsertRecurringInput) {
    return RecurringExpense.findOneAndUpdate(
      { userId: data.userId, merchant: data.merchant },
      { $set: data },
      { upsert: true, new: true }
    ).exec();
  }

  async create(data: UpsertRecurringInput) {
    return RecurringExpense.create(data);
  }

  async sumUpcoming(userId: string, withinDays: number): Promise<number> {
    const until = new Date();
    until.setDate(until.getDate() + withinDays);
    const items = await RecurringExpense.find({
      userId,
      isActive: true,
      nextExpectedDate: { $lte: until },
    })
      .select('averageAmount')
      .lean()
      .exec();
    return items.reduce((sum, item) => sum + (item.averageAmount ?? 0), 0);
  }
}

export const recurringRepository = new RecurringRepository();
