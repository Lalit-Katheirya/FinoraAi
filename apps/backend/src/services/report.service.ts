import { roundMoney, toISODate } from '@finora/shared';
import { transactionRepository } from '../repositories/transaction.repository';

export type ReportPeriod = 'monthly' | 'quarterly' | 'annual';

function periodRange(
  period: ReportPeriod,
  year: number,
  month?: number,
  quarter?: number
): { from: Date; to: Date; label: string } {
  if (period === 'monthly') {
    const m = (month ?? new Date().getMonth() + 1) - 1;
    const from = new Date(year, m, 1);
    const to = new Date(year, m + 1, 0, 23, 59, 59, 999);
    return { from, to, label: `${year}-${String(m + 1).padStart(2, '0')}` };
  }

  if (period === 'quarterly') {
    const q = quarter ?? Math.floor(new Date().getMonth() / 3) + 1;
    const startMonth = (q - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    return { from, to, label: `${year}-Q${q}` };
  }

  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31, 23, 59, 59, 999);
  return { from, to, label: String(year) };
}

export class ReportService {
  async summary(
    userId: string,
    options: {
      period: ReportPeriod;
      year?: number;
      month?: number;
      quarter?: number;
    }
  ) {
    const year = options.year ?? new Date().getFullYear();
    const { from, to, label } = periodRange(
      options.period,
      year,
      options.month,
      options.quarter
    );

    const txs = await transactionRepository.findInDateRange(userId, from, to);
    let income = 0;
    let expenses = 0;
    const byCategory = new Map<string, number>();

    for (const tx of txs) {
      const amount = Number(tx.amount);
      if (String(tx.type) === 'income') income += amount;
      if (String(tx.type) === 'expense') {
        expenses += amount;
        const cat = String(tx.categoryName ?? 'Other');
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + amount);
      }
    }

    const categories = [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount: roundMoney(amount) }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: options.period,
      label,
      from: toISODate(from),
      to: toISODate(to),
      income: roundMoney(income),
      expenses: roundMoney(expenses),
      net: roundMoney(income - expenses),
      transactionCount: txs.length,
      categories,
    };
  }

  async exportCsv(
    userId: string,
    options: {
      period: ReportPeriod;
      year?: number;
      month?: number;
      quarter?: number;
    }
  ): Promise<string> {
    const year = options.year ?? new Date().getFullYear();
    const { from, to } = periodRange(
      options.period,
      year,
      options.month,
      options.quarter
    );
    const txs = await transactionRepository.findInDateRange(userId, from, to);

    const header = [
      'date',
      'type',
      'amount',
      'merchant',
      'category',
      'description',
      'accountId',
    ];
    const lines = [header.join(',')];

    for (const tx of txs) {
      const date =
        tx.transactionDate instanceof Date
          ? toISODate(tx.transactionDate)
          : toISODate(new Date(String(tx.transactionDate)));
      const row = [
        date,
        String(tx.type),
        String(tx.amount),
        csvEscape(String(tx.merchant ?? '')),
        csvEscape(String(tx.categoryName ?? '')),
        csvEscape(String(tx.description ?? '')),
        String(tx.accountId),
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const reportService = new ReportService();
