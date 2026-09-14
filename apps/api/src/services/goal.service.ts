import type { GoalDto } from '@finora/shared';
import {
  goalRepository,
  type CreateGoalInput,
  type UpdateGoalInput,
} from '../repositories/goal.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';
import { computeGoalMetrics } from '../utils/financeMetrics';

function dateIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export class GoalService {
  private toDto(goal: {
    _id: unknown;
    userId: unknown;
    name: unknown;
    targetAmount: unknown;
    currentAmount: unknown;
    targetDate: unknown;
    monthlyContribution: unknown;
    priority: unknown;
    category: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  }): GoalDto {
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const monthlyContribution = Number(goal.monthlyContribution);
    const targetDate = new Date(String(goal.targetDate));
    const metrics = computeGoalMetrics({
      targetAmount,
      currentAmount,
      targetDate,
      monthlyContribution,
    });

    return {
      id: String(goal._id),
      userId: String(goal.userId),
      name: String(goal.name),
      targetAmount,
      currentAmount,
      targetDate: dateIso(goal.targetDate),
      monthlyContribution,
      priority: goal.priority as GoalDto['priority'],
      category: String(goal.category),
      progressPercent: metrics.progressPercent,
      requiredMonthly: metrics.requiredMonthly,
      shortfall: metrics.shortfall,
      suggestedMonthly: metrics.suggestedMonthly,
      expectedCompletionDate: metrics.expectedCompletionDate,
      createdAt: dateIso(goal.createdAt),
      updatedAt: dateIso(goal.updatedAt),
    };
  }

  async list(userId: string): Promise<GoalDto[]> {
    const goals = await goalRepository.findByUser(userId);
    return goals.map((g) => this.toDto(g as never));
  }

  async getById(userId: string, id: string): Promise<GoalDto> {
    const goal = await goalRepository.findById(id);
    if (!goal) throw AppError.notFound('Goal not found');
    assertOwned(String(goal.userId), userId);
    return this.toDto(goal as never);
  }

  async create(userId: string, input: Omit<CreateGoalInput, 'userId'>): Promise<GoalDto> {
    const created = await goalRepository.create({ ...input, userId });
    return this.toDto(created as never);
  }

  async update(userId: string, id: string, input: UpdateGoalInput): Promise<GoalDto> {
    const goal = await goalRepository.findById(id);
    if (!goal) throw AppError.notFound('Goal not found');
    assertOwned(String(goal.userId), userId);
    const updated = await goalRepository.update(id, input);
    if (!updated) throw AppError.notFound('Goal not found');
    return this.toDto(updated as never);
  }

  async remove(userId: string, id: string): Promise<void> {
    const goal = await goalRepository.findById(id);
    if (!goal) throw AppError.notFound('Goal not found');
    assertOwned(String(goal.userId), userId);
    await goalRepository.delete(id);
  }
}

export const goalService = new GoalService();
