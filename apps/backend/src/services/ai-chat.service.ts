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
import { dashboardService } from './dashboard.service';

const agent = new FinanceAgentService({
  llmConfig: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    provider: env.OPENAI_API_KEY ? 'openai' : 'mock',
  },
});

function buildToolContext(userId: string): FinanceToolContext {
  return {
    userId,

    async getTransactions(filter) {
      const result = await transactionService.list(userId, {
        page: 1,
        limit: filter?.limit ?? 50,
        dateFrom: filter?.from ? new Date(filter.from) : undefined,
        dateTo: filter?.to ? new Date(filter.to) : undefined,
      });
      return result.data;
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

    async getCategorySpending() {
      const dash = await dashboardService.getSummary(userId);
      return (dash.chartData.categoryBreakdown ?? []).map((row) => ({
        categoryName: row.category,
        amount: row.amount,
        transactionCount: 0,
      }));
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
      const shortfall = Math.max(0, goal.targetAmount - goal.currentAmount);
      const progressPercent =
        goal.targetAmount > 0
          ? roundMoney((goal.currentAmount / goal.targetAmount) * 100)
          : 0;

      return {
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        requiredMonthly: required,
        suggestedMonthly: required,
        shortfall,
        progressPercent,
      };
    },

    async getInvestmentSummary() {
      const holdings = await investmentService.list(userId);
      const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
      const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const profitLoss = roundMoney(currentValue - totalInvested);
      const returnPercent =
        totalInvested > 0 ? roundMoney((profitLoss / totalInvested) * 100) : 0;

      return {
        totalInvested: roundMoney(totalInvested),
        currentValue: roundMoney(currentValue),
        profitLoss,
        returnPercent,
        holdings,
      };
    },

    async calculateSavingsRate() {
      const summary = await dashboardService.getSummary(userId);
      const income = summary.monthlyIncome;
      const expenses = summary.monthlyExpenses;
      const savings = summary.savings;
      const savingsRatePercent =
        income > 0 ? roundMoney(((income - expenses) / income) * 100) : 0;

      return { income, expenses, savings, savingsRatePercent };
    },

    async detectRecurringExpenses() {
      return recurringService.list(userId);
    },

    async detectUnusualTransactions(lookbackDays?: number) {
      const anomalies = await anomalyService.detect(userId, { lookbackDays });
      const unusual = [];

      for (const item of anomalies.slice(0, 15)) {
        try {
          const transaction = await transactionService.getById(
            userId,
            item.transactionId
          );
          unusual.push({
            transaction,
            reason: item.reason,
            score: Math.abs(item.zScore),
          });
        } catch {
          // Skip deleted/missing transactions
        }
      }

      return unusual;
    },

    async generateFinancialSummary() {
      const summary = await dashboardService.getSummary(userId);
      return {
        totalBalance: summary.totalBalance,
        monthlyIncome: summary.monthlyIncome,
        monthlyExpenses: summary.monthlyExpenses,
        savings: summary.savings,
        investments: summary.investments,
        currency: summary.currency,
      };
    },

    async forecastCashFlow(months = 3) {
      const forecast = await forecastService.cashFlow(userId, months ?? 3);
      return {
        points: forecast.months.map((m) => ({
          month: m.month,
          projectedIncome: m.projectedIncome,
          projectedExpenses: m.projectedExpenses,
          projectedNet: m.projectedNet,
        })),
        assumptions: [
          'Projection uses recent income/expense averages and recurring bills.',
          `Historical net cash proxy used as start: ${forecast.startingBalance}`,
        ],
      };
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
