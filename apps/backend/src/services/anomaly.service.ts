import { roundMoney, toISODate } from '@finora/shared';
import { transactionRepository } from '../repositories/transaction.repository';

export interface AnomalyResult {
  transactionId: string;
  merchant?: string;
  categoryName?: string;
  amount: number;
  mean: number;
  stdDev: number;
  zScore: number;
  transactionDate: string;
  reason: string;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export class AnomalyService {
  async detect(
    userId: string,
    options: { lookbackDays?: number; zThreshold?: number } = {}
  ): Promise<AnomalyResult[]> {
    const lookbackDays = options.lookbackDays ?? 90;
    const zThreshold = options.zThreshold ?? 2;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const txs = await transactionRepository.findSince(userId, since);
    const byMerchant = new Map<string, number[]>();
    const byCategory = new Map<string, number[]>();

    for (const tx of txs) {
      if (String(tx.type) !== 'expense') continue;
      const amount = Number(tx.amount);
      const merchant = String(tx.merchant ?? '').trim().toUpperCase();
      const category = String(tx.categoryName ?? '').trim().toUpperCase();
      if (merchant) {
        const list = byMerchant.get(merchant) ?? [];
        list.push(amount);
        byMerchant.set(merchant, list);
      }
      if (category) {
        const list = byCategory.get(category) ?? [];
        list.push(amount);
        byCategory.set(category, list);
      }
    }

    const anomalies: AnomalyResult[] = [];

    for (const tx of txs) {
      if (String(tx.type) !== 'expense') continue;
      const amount = Number(tx.amount);
      const merchant = String(tx.merchant ?? '').trim().toUpperCase();
      const category = String(tx.categoryName ?? '').trim().toUpperCase();

      const merchantHistory = merchant ? byMerchant.get(merchant) ?? [] : [];
      const categoryHistory = category ? byCategory.get(category) ?? [] : [];
      const history =
        merchantHistory.length >= 3
          ? merchantHistory
          : categoryHistory.length >= 3
            ? categoryHistory
            : [];

      if (history.length < 3) continue;

      const avg = mean(history);
      const sd = stdDev(history, avg);
      if (sd === 0) continue;

      const z = (amount - avg) / sd;
      if (Math.abs(z) < zThreshold) continue;

      const date =
        tx.transactionDate instanceof Date
          ? tx.transactionDate
          : new Date(String(tx.transactionDate));

      anomalies.push({
        transactionId: String(tx._id),
        merchant: tx.merchant ? String(tx.merchant) : undefined,
        categoryName: tx.categoryName ? String(tx.categoryName) : undefined,
        amount: roundMoney(amount),
        mean: roundMoney(avg),
        stdDev: roundMoney(sd),
        zScore: roundMoney(z, 2),
        transactionDate: toISODate(date),
        reason:
          z > 0
            ? 'Unusually high amount vs historical pattern'
            : 'Unusually low amount vs historical pattern',
      });
    }

    return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  }
}

export const anomalyService = new AnomalyService();
