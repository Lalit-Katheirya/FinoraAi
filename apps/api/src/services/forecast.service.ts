import { addMonths, roundMoney, startOfMonth, toISODate } from '@finora/shared';
import { recurringRepository } from '../repositories/recurring.repository';
import { transactionRepository } from '../repositories/transaction.repository';

export interface ForecastMonth {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNet: number;
  endingBalance: number;
}

export class ForecastService {
  async cashFlow(userId: string, months = 6): Promise<{
    startingBalance: number;
    months: ForecastMonth[];
  }> {
    const now = new Date();
    const lookbackFrom = addMonths(startOfMonth(now), -3);
    const lookbackTo = now;

    const [history, recurring] = await Promise.all([
      transactionRepository.findInDateRange(userId, lookbackFrom, lookbackTo),
      recurringRepository.findByUser(userId, true),
    ]);

    let incomeTotal = 0;
    let expenseTotal = 0;
    const monthKeys = new Set<string>();

    for (const tx of history) {
      const d =
        tx.transactionDate instanceof Date
          ? tx.transactionDate
          : new Date(String(tx.transactionDate));
      monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
      if (String(tx.type) === 'income') incomeTotal += Number(tx.amount);
      if (String(tx.type) === 'expense') expenseTotal += Number(tx.amount);
    }

    const monthCount = Math.max(1, monthKeys.size);
    const avgIncome = incomeTotal / monthCount;
    const avgExpense = expenseTotal / monthCount;

    const monthlyRecurring = recurring.reduce((sum, r) => {
      const freq = String(r.frequency);
      const amount = Number(r.averageAmount);
      if (freq === 'weekly') return sum + amount * 4.33;
      if (freq === 'monthly') return sum + amount;
      if (freq === 'quarterly') return sum + amount / 3;
      if (freq === 'yearly') return sum + amount / 12;
      return sum;
    }, 0);

    const projectedMonthlyExpense = Math.max(avgExpense, monthlyRecurring);
    // Use net historical cash movement as starting balance proxy
    let balance = roundMoney(incomeTotal - expenseTotal);

    const result: ForecastMonth[] = [];
    for (let i = 1; i <= months; i += 1) {
      const monthDate = addMonths(startOfMonth(now), i);
      const projectedIncome = roundMoney(avgIncome);
      const projectedExpenses = roundMoney(projectedMonthlyExpense);
      const projectedNet = roundMoney(projectedIncome - projectedExpenses);
      balance = roundMoney(balance + projectedNet);
      result.push({
        month: toISODate(monthDate).slice(0, 7),
        projectedIncome,
        projectedExpenses,
        projectedNet,
        endingBalance: balance,
      });
    }

    return {
      startingBalance: roundMoney(incomeTotal - expenseTotal),
      months: result,
    };
  }
}

export const forecastService = new ForecastService();
