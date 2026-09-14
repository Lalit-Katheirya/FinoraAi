import {
  BUDGET_ALERT_THRESHOLDS,
  percentOf,
  roundMoney,
  type BudgetDto,
} from '@finora/shared';
import {
  budgetRepository,
  type CreateBudgetInput,
  type UpdateBudgetInput,
} from '../repositories/budget.repository';
import { categoryRepository } from '../repositories/category.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';

function dateIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export class BudgetService {
  private async withSpent(userId: string, budget: {
    _id: unknown;
    userId: unknown;
    name: unknown;
    period: unknown;
    categoryId?: unknown;
    amount: unknown;
    currency: unknown;
    startDate: unknown;
    endDate: unknown;
    alertThresholds?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  }): Promise<BudgetDto> {
    const startDate = new Date(String(budget.startDate));
    const endDate = new Date(String(budget.endDate));
    const categoryId = budget.categoryId ? String(budget.categoryId) : undefined;
    const spent = await transactionRepository.sumExpensesByCategory(
      userId,
      categoryId,
      startDate,
      endDate
    );
    const amount = Number(budget.amount);
    const remaining = roundMoney(Math.max(0, amount - spent));
    const percentUsed = percentOf(spent, amount);

    let categoryName: string | undefined;
    if (categoryId) {
      const category = await categoryRepository.findById(categoryId);
      categoryName = category ? String(category.name) : undefined;
    }

    return {
      id: String(budget._id),
      userId: String(budget.userId),
      name: String(budget.name),
      period: budget.period as BudgetDto['period'],
      categoryId,
      categoryName,
      amount,
      spent: roundMoney(spent),
      remaining,
      percentUsed,
      currency: (budget.currency as BudgetDto['currency']) ?? 'INR',
      startDate: dateIso(budget.startDate),
      endDate: dateIso(budget.endDate),
      alertThresholds: Array.isArray(budget.alertThresholds)
        ? (budget.alertThresholds as number[])
        : [...BUDGET_ALERT_THRESHOLDS],
      createdAt: dateIso(budget.createdAt),
      updatedAt: dateIso(budget.updatedAt),
    };
  }

  async list(userId: string): Promise<BudgetDto[]> {
    const budgets = await budgetRepository.findByUser(userId);
    return Promise.all(budgets.map((b) => this.withSpent(userId, b as never)));
  }

  async getById(userId: string, id: string): Promise<BudgetDto> {
    const budget = await budgetRepository.findById(id);
    if (!budget) throw AppError.notFound('Budget not found');
    assertOwned(String(budget.userId), userId);
    return this.withSpent(userId, budget as never);
  }

  async create(
    userId: string,
    input: Omit<CreateBudgetInput, 'userId'>
  ): Promise<BudgetDto> {
    if (input.endDate < input.startDate) {
      throw AppError.badRequest('endDate must be after startDate');
    }
    const created = await budgetRepository.create({
      ...input,
      userId,
      alertThresholds: input.alertThresholds ?? [...BUDGET_ALERT_THRESHOLDS],
    });
    return this.withSpent(userId, created as never);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateBudgetInput
  ): Promise<BudgetDto> {
    const budget = await budgetRepository.findById(id);
    if (!budget) throw AppError.notFound('Budget not found');
    assertOwned(String(budget.userId), userId);

    const updated = await budgetRepository.update(id, input);
    if (!updated) throw AppError.notFound('Budget not found');
    return this.withSpent(userId, updated as never);
  }

  async remove(userId: string, id: string): Promise<void> {
    const budget = await budgetRepository.findById(id);
    if (!budget) throw AppError.notFound('Budget not found');
    assertOwned(String(budget.userId), userId);
    await budgetRepository.delete(id);
  }
}

export const budgetService = new BudgetService();
