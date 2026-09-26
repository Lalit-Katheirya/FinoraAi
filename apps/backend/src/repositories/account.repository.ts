import type { AccountType, CurrencyCode } from '@finora/shared';
import { Account } from '../models';
import { toObjectId } from '../utils/objectId';

export interface CreateAccountInput {
  userId: string;
  name: string;
  type: AccountType;
  institution?: string;
  accountNumberMasked?: string;
  currentBalance: number;
  availableBalance: number;
  currency: CurrencyCode;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  institution?: string;
  accountNumberMasked?: string;
  currentBalance?: number;
  availableBalance?: number;
  currency?: CurrencyCode;
  isActive?: boolean;
}

export class AccountRepository {
  async findByUser(userId: string) {
    return Account.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    return Account.findById(id).exec();
  }

  async create(data: CreateAccountInput) {
    return Account.create(data);
  }

  async update(id: string, data: UpdateAccountInput) {
    return Account.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string) {
    return Account.findByIdAndDelete(id).exec();
  }

  async sumBalances(userId: string): Promise<number> {
    const result = await Account.aggregate<{ total: number }>([
      {
        $match: {
          userId: toObjectId(userId),
          isActive: { $ne: false },
        },
      },
      { $group: { _id: null, total: { $sum: '$currentBalance' } } },
    ]);
    return result[0]?.total ?? 0;
  }
}

export const accountRepository = new AccountRepository();
