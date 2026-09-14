import type { AccountDto } from '@finora/shared';
import { accountRepository, type CreateAccountInput, type UpdateAccountInput } from '../repositories/account.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';
import { toAccountDto } from '../utils/mappers';

export class AccountService {
  async list(userId: string): Promise<AccountDto[]> {
    const accounts = await accountRepository.findByUser(userId);
    return accounts.map((a) => toAccountDto(a as never) as AccountDto);
  }

  async getById(userId: string, id: string): Promise<AccountDto> {
    const account = await accountRepository.findById(id);
    if (!account) throw AppError.notFound('Account not found');
    assertOwned(String(account.userId), userId);
    return toAccountDto(account as never) as AccountDto;
  }

  async create(
    userId: string,
    input: Omit<CreateAccountInput, 'userId' | 'availableBalance'> & {
      availableBalance?: number;
    }
  ): Promise<AccountDto> {
    const created = await accountRepository.create({
      ...input,
      userId,
      availableBalance: input.availableBalance ?? input.currentBalance,
    });
    return toAccountDto(created as never) as AccountDto;
  }

  async update(userId: string, id: string, input: UpdateAccountInput): Promise<AccountDto> {
    const account = await accountRepository.findById(id);
    if (!account) throw AppError.notFound('Account not found');
    assertOwned(String(account.userId), userId);

    const updated = await accountRepository.update(id, input);
    if (!updated) throw AppError.notFound('Account not found');
    return toAccountDto(updated as never) as AccountDto;
  }

  async remove(userId: string, id: string): Promise<void> {
    const account = await accountRepository.findById(id);
    if (!account) throw AppError.notFound('Account not found');
    assertOwned(String(account.userId), userId);
    await accountRepository.delete(id);
  }
}

export const accountService = new AccountService();
