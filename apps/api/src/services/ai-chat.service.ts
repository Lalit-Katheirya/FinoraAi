import {
  FinanceAgentService,
  type FinanceToolContext,
} from '@finora/ai';
import type { AiStructuredResponse } from '@finora/shared';
import {
  addMonths,
  endOfMonth,
  monthsBetween,
  requiredMonthlyContribution,
  roundMoney,
  startOfMonth,
  toISODate,
} from '@finora/shared';
import { env } from '../config/env';
import { AiConversation } from '../models';
import { transactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../utils/AppError';
import { transactionService } from './transaction.service';
import { accountService } from './account.service';
import { budgetService } from './budget.service';
import { goalService } from './goal.service';
import { investmentService } from './investment.service';
import { recurringService } from './recurring.service';
import { anomalyService } from './anomaly.service';
import { forecastService } from './forecast.service';
import { insightService } from './insight.service';
import { dashboardService } from './dashboard.service';

const agent = new FinanceAgentService({
  llmConfig: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  },
});

function buildToolContext(userId: string): FinanceToolContext {
  return {
    userId,
    async getTransactions(params) {
      const result = await transactionService.list(userId, {
        page: 1,
        limit: params?.limit ?? 50,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        type: params?.type,
        accountId: params?.accountId,
        categoryId: params?.categoryId,
      });
      return result.items;
    },
    async getAccountBalances() {
      return accountService.list(userId);
    },
    async getMonthlyExpenses(months = 3) {
      const lookback = Math.max(1, months);
      const now = startOfMonth(new Date());
      const summaries = [];

      for (let i = lookback - 1; i >= 0; i -= 1) {
        const monthDate = addMonths(now, -i);
        const from = startOfMonth(monthDate);
        const to = endOfMonth(monthDate);
        const [totalIncome, totalExpenses] = await Promise.all([
          transactionRepository.sumByType(userId, 'income', from, to),
          transactionRepository.sumByType(userId, 'expense', from, to),
        ]);
        summaries.push({
          month: toISODate(from).slice(0, 7),
          totalExpenses: roundMoney(totalExpenses),
          totalIncome: roundMoney(totalIncome),
          net: roundMoney(totalIncome - totalExpenses),
        });
      }

      return summaries;
    },
    async getCategorySpending(params) {
      const dash = await dashboardService.getSummary(userId);
      return (dash as { expenseByCategory?: unknown }).expenseByCategory ?? [];
    },
    async getBudgetStatus() {
      return budgetService.list(userId);
    },
    async getGoals() {
      return goalService.list(userId);
    },
    async calculateGoalContribution(goalId: string) {
      const goal = await goalService.getById(userId, goalId);
      const months = monthsBetween(new Date(), new Date(goal.targetDate));
      const required = requiredMonthlyContribution(
        goal.targetAmount,
        goal.currentAmount,
        months || 1
      );
      return {
        goalId,
        name: goal.name,
        requiredMonthly: required,
        monthsRemaining: months,
        shortfall: Math.max(0, goal.targetAmount - goal.currentAmount),
      };
    },
    async getInvestmentSummary() {
      return investmentService.summary(userId);
    },
    async calculateSavingsRate() {
      const summary = await dashboardService.getSummary(userId);
      const income = summary.monthlyIncome;
      const expenses = summary.monthlyExpenses;
      const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      return { income, expenses, savingsRate: Math.round(rate * 10) / 10 };
    },
    async detectRecurringExpenses() {
      return recurringService.list(userId);
    },
    async detectUnusualTransactions() {
      return anomalyService.detect(userId);
    },
    async generateFinancialSummary() {
      return insightService.dailySummary(userId);
    },
    async forecastCashFlow(months = 3) {
      return forecastService.forecast(userId, months);
    },
  };
}

export const aiChatService = {
  async chat(userId: string, message: string, conversationId?: string) {
    let conversation = conversationId
      ? await AiConversation.findOne({ _id: conversationId, userId })
      : null;

    if (conversationId && !conversation) {
      throw AppError.notFound('Conversation not found');
    }

    if (!conversation) {
      conversation = await AiConversation.create({
        userId,
        title: message.slice(0, 80),
        messages: [],
      });
    }

    const context = buildToolContext(userId);
    const result = await agent.chat(
      { message, conversationId: String(conversation._id) },
      context
    );

    const structured = result.response as AiStructuredResponse;

    conversation.messages.push(
      { role: 'user', content: message, createdAt: new Date() },
      {
        role: 'assistant',
        content: structured.text,
        structured,
        createdAt: new Date(),
      }
    );
    await conversation.save();

    return {
      conversationId: String(conversation._id),
      message: {
        role: 'assistant' as const,
        content: structured.text,
        structured,
        createdAt: new Date().toISOString(),
      },
    };
  },

  async listConversations(userId: string) {
    const list = await AiConversation.find({ userId })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    return list.map((c) => ({
      id: String(c._id),
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  },

  async getConversation(userId: string, id: string) {
    const conversation = await AiConversation.findOne({ _id: id, userId }).lean();
    if (!conversation) throw AppError.notFound('Conversation not found');
    return {
      id: String(conversation._id),
      title: conversation.title,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  },
};
