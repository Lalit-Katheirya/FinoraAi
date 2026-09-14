import {
  endOfMonth,
  formatCurrency,
  roundMoney,
  startOfMonth,
  type FinancialInsightDto,
} from '@finora/shared';
import { insightRepository } from '../repositories/insight.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { budgetService } from './budget.service';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';
import { toInsightDto } from '../utils/mappers';

export class InsightService {
  async list(userId: string, unreadOnly = false): Promise<FinancialInsightDto[]> {
    const items = await insightRepository.findByUser(userId, unreadOnly);
    return items.map((i) => toInsightDto(i as never) as FinancialInsightDto);
  }

  async markRead(userId: string, id: string): Promise<FinancialInsightDto> {
    const insight = await insightRepository.findById(id);
    if (!insight) throw AppError.notFound('Insight not found');
    assertOwned(String(insight.userId), userId);
    const updated = await insightRepository.markRead(id);
    if (!updated) throw AppError.notFound('Insight not found');
    return toInsightDto(updated as never) as FinancialInsightDto;
  }

  async generateDailySummary(userId: string): Promise<FinancialInsightDto[]> {
    const now = new Date();
    const from = startOfMonth(now);
    const to = endOfMonth(now);

    const [income, expenses, budgets] = await Promise.all([
      transactionRepository.sumByType(userId, 'income', from, to),
      transactionRepository.sumByType(userId, 'expense', from, to),
      budgetService.list(userId),
    ]);

    const created = [];

    const net = roundMoney(income - expenses);
    created.push(
      await insightRepository.create({
        userId,
        title: 'Daily financial summary',
        message: `This month: income ${formatCurrency(income)}, expenses ${formatCurrency(expenses)}, net ${formatCurrency(net)}.`,
        severity: net >= 0 ? 'success' : 'warning',
        category: 'summary',
        isRead: false,
      })
    );

    for (const budget of budgets) {
      if (budget.percentUsed >= 90) {
        created.push(
          await insightRepository.create({
            userId,
            title: `Budget alert: ${budget.name}`,
            message: `You have used ${budget.percentUsed}% of your ${budget.name} budget (${formatCurrency(budget.spent)} of ${formatCurrency(budget.amount)}).`,
            severity: budget.percentUsed >= 100 ? 'critical' : 'warning',
            category: 'budget',
            isRead: false,
          })
        );
      }
    }

    if (expenses > income * 0.9 && income > 0) {
      created.push(
        await insightRepository.create({
          userId,
          title: 'High spending pace',
          message:
            'Your expenses are close to or above income this month. Consider reviewing discretionary categories.',
          severity: 'warning',
          category: 'spending',
          isRead: false,
        })
      );
    }

    return created.map((i) => toInsightDto(i as never) as FinancialInsightDto);
  }
}

export const insightService = new InsightService();
