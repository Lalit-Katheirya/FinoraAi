import type { InsightSeverity } from '@finora/shared';
import { FinancialInsight } from '../models';

export interface CreateInsightInput {
  userId: string;
  title: string;
  message: string;
  severity: InsightSeverity;
  category?: string;
  expiresAt?: Date;
  isRead?: boolean;
}

export class InsightRepository {
  async findByUser(userId: string, unreadOnly = false) {
    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) filter.isRead = false;
    return FinancialInsight.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    return FinancialInsight.findById(id).exec();
  }

  async create(data: CreateInsightInput) {
    return FinancialInsight.create(data);
  }

  async createMany(data: CreateInsightInput[]) {
    return FinancialInsight.insertMany(data);
  }

  async markRead(id: string) {
    return FinancialInsight.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    ).exec();
  }

  async deleteOlderThan(userId: string, before: Date) {
    return FinancialInsight.deleteMany({
      userId,
      createdAt: { $lt: before },
    }).exec();
  }
}

export const insightRepository = new InsightRepository();
