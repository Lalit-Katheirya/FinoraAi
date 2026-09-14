import type { BudgetPeriod, CurrencyCode } from '@finora/shared';
import { Budget } from '../models';

export interface CreateBudgetInput {
  userId: string;
  name: string;
  period: BudgetPeriod;
  categoryId?: string;
  amount: number;
  currency: CurrencyCode;
  startDate: Date;
  endDate: Date;
  alertThresholds?: number[];
}

export interface UpdateBudgetInput {
  name?: string;
  period?: BudgetPeriod;
  categoryId?: string | null;
  amount?: number;
  currency?: CurrencyCode;
  startDate?: Date;
  endDate?: Date;
  alertThresholds?: number[];
}

export class BudgetRepository {
  async findByUser(userId: string) {
    return Budget.find({ userId }).sort({ startDate: -1 }).exec();
  }

  async findById(id: string) {
    return Budget.findById(id).exec();
  }

  async create(data: CreateBudgetInput) {
    return Budget.create(data);
  }

  async update(id: string, data: UpdateBudgetInput) {
    return Budget.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string) {
    return Budget.findByIdAndDelete(id).exec();
  }
}

export const budgetRepository = new BudgetRepository();
