import type { GoalPriority } from '@finora/shared';
import { Goal } from '../models';

export interface CreateGoalInput {
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  priority: GoalPriority;
  category: string;
}

export interface UpdateGoalInput {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: Date;
  monthlyContribution?: number;
  priority?: GoalPriority;
  category?: string;
}

export class GoalRepository {
  async findByUser(userId: string) {
    return Goal.find({ userId }).sort({ targetDate: 1 }).exec();
  }

  async findById(id: string) {
    return Goal.findById(id).exec();
  }

  async create(data: CreateGoalInput) {
    return Goal.create(data);
  }

  async update(id: string, data: UpdateGoalInput) {
    return Goal.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async delete(id: string) {
    return Goal.findByIdAndDelete(id).exec();
  }
}

export const goalRepository = new GoalRepository();
