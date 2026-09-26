import {
  endOfMonth,
  roundMoney,
  startOfMonth,
  type DashboardSummaryDto,
  type FinancialInsightDto,
  type TransactionDto,
} from '@finora/shared';
import { accountRepository } from '../repositories/account.repository';
import { investmentRepository } from '../repositories/investment.repository';
import { recurringRepository } from '../repositories/recurring.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { toTransactionDto } from '../utils/mappers';
import { insightService } from './insight.service';

export interface DashboardResponse extends DashboardSummaryDto {
  recentTransactions: TransactionDto[];
  chartData: {
    incomeVsExpense: Array<{ label: string; income: number; expense: number }>;
    categoryBreakdown: Array<{ category: string; amount: number }>;
  };
}

export class DashboardService {
  async getSummary(userId: string): Promise<DashboardResponse> {
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);

    const [
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      investments,
      upcomingBills,
      recent,
      insights,
      monthTx,
    ] = await Promise.all([
      accountRepository.sumBalances(userId),
      transactionRepository.sumByType(userId, 'income', from, to),
      transactionRepository.sumByType(userId, 'expense', from, to),
      investmentRepository.sumCurrentValue(userId),
      recurringRepository.sumUpcoming(userId, 30),
      transactionRepository.findRecent(userId, 8),
      insightService.list(userId, false),
      transactionRepository.findInDateRange(userId, from, to),
    ]);

    const savings = roundMoney(monthlyIncome - monthlyExpenses);

    const categoryMap = new Map<string, number>();
    for (const tx of monthTx) {
      if (String(tx.type) !== 'expense') continue;
      const key = String(tx.categoryName ?? 'Other');
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + Number(tx.amount));
    }

    const categoryBreakdown = [...categoryMap.entries()]
      .map(([category, amount]) => ({ category, amount: roundMoney(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    return {
      totalBalance: roundMoney(totalBalance),
      monthlyIncome: roundMoney(monthlyIncome),
      monthlyExpenses: roundMoney(monthlyExpenses),
      savings,
      investments: roundMoney(investments),
      upcomingBills: roundMoney(upcomingBills),
      currency: 'INR',
      insights: insights.slice(0, 5) as FinancialInsightDto[],
      recentTransactions: recent.map(
        (t) => toTransactionDto(t as never) as TransactionDto
      ),
      chartData: {
        incomeVsExpense: [
          {
            label: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            income: roundMoney(monthlyIncome),
            expense: roundMoney(monthlyExpenses),
          },
        ],
        categoryBreakdown,
      },
    };
  }
}

export const dashboardService = new DashboardService();
