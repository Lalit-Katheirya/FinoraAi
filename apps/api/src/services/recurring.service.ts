import type { RecurringExpenseDto } from '@finora/shared';
import { addMonths, daysBetween, roundMoney } from '@finora/shared';
import {
  recurringRepository,
  type RecurringFrequency,
} from '../repositories/recurring.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { toRecurringDto } from '../utils/mappers';

interface MerchantGroup {
  merchant: string;
  categoryId?: string;
  amounts: number[];
  dates: Date[];
}

function inferFrequency(dates: Date[]): RecurringFrequency | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    gaps.push(daysBetween(sorted[i - 1], sorted[i]));
  }
  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

  if (avgGap >= 5 && avgGap <= 9) return 'weekly';
  if (avgGap >= 25 && avgGap <= 35) return 'monthly';
  if (avgGap >= 80 && avgGap <= 100) return 'quarterly';
  if (avgGap >= 350 && avgGap <= 380) return 'yearly';
  return null;
}

function nextDate(last: Date, frequency: RecurringFrequency): Date {
  const d = new Date(last);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      return addMonths(d, 1);
    case 'quarterly':
      return addMonths(d, 3);
    case 'yearly':
      return addMonths(d, 12);
    default:
      return addMonths(d, 1);
  }
  return d;
}

export class RecurringService {
  async list(userId: string): Promise<RecurringExpenseDto[]> {
    const items = await recurringRepository.findByUser(userId);
    return items.map((i) => toRecurringDto(i as never) as RecurringExpenseDto);
  }

  async detect(
    userId: string,
    options: { minOccurrences?: number; lookbackDays?: number } = {}
  ): Promise<RecurringExpenseDto[]> {
    const minOccurrences = options.minOccurrences ?? 3;
    const lookbackDays = options.lookbackDays ?? 180;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const txs = await transactionRepository.findSince(userId, since);
    const groups = new Map<string, MerchantGroup>();

    for (const tx of txs) {
      if (String(tx.type) !== 'expense') continue;
      const merchant = String(tx.merchant ?? '').trim();
      if (!merchant) continue;

      const key = merchant.toUpperCase();
      const existing = groups.get(key) ?? {
        merchant,
        categoryId: tx.categoryId ? String(tx.categoryId) : undefined,
        amounts: [],
        dates: [],
      };
      existing.amounts.push(Number(tx.amount));
      existing.dates.push(
        tx.transactionDate instanceof Date
          ? tx.transactionDate
          : new Date(String(tx.transactionDate))
      );
      groups.set(key, existing);
    }

    const detected: RecurringExpenseDto[] = [];

    for (const group of groups.values()) {
      if (group.dates.length < minOccurrences) continue;
      const frequency = inferFrequency(group.dates);
      if (!frequency) continue;

      const averageAmount = roundMoney(
        group.amounts.reduce((s, a) => s + a, 0) / group.amounts.length
      );
      const lastDate = [...group.dates].sort((a, b) => b.getTime() - a.getTime())[0];
      const lastAmount = group.amounts[group.amounts.length - 1];

      const saved = await recurringRepository.upsertByMerchant({
        userId,
        merchant: group.merchant,
        categoryId: group.categoryId,
        frequency,
        averageAmount,
        nextExpectedDate: nextDate(lastDate, frequency),
        lastAmount,
        occurrenceCount: group.dates.length,
        isActive: true,
      });

      detected.push(toRecurringDto(saved as never) as RecurringExpenseDto);
    }

    return detected;
  }
}

export const recurringService = new RecurringService();
