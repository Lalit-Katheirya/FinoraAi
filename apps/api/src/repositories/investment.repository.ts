import type { InvestmentType } from '@finora/shared';
import { Investment } from '../models';
import { toObjectId } from '../utils/objectId';

export interface CreateInvestmentInput {
  userId: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  units?: number;
  purchaseDate: Date;
  notes?: string;
}

export interface UpdateInvestmentInput {
  name?: string;
  type?: InvestmentType;
  investedAmount?: number;
  currentValue?: number;
  units?: number | null;
  purchaseDate?: Date;
  notes?: string | null;
}

export class InvestmentRepository {
  async findByUser(userId: string) {
    return Investment.find({ userId }).sort({ purchaseDate: -1 }).exec();
  }

  async findById(id: string) {
    return Investment.findById(id).exec();
  }

  async create(data: CreateInvestmentInput) {
    return Investment.create(data);
  }

  async update(id: string, data: UpdateInvestmentInput) {
    return Investment.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string) {
    return Investment.findByIdAndDelete(id).exec();
  }

  async sumCurrentValue(userId: string): Promise<number> {
    const result = await Investment.aggregate<{ total: number }>([
      { $match: { userId: toObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$currentValue' } } },
    ]);
    return result[0]?.total ?? 0;
  }
}

export const investmentRepository = new InvestmentRepository();
