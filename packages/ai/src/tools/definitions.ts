import type { FinanceIntent } from '../schemas/intent.schema';
import type { FinanceToolName, ToolCallRequest } from './types';

export interface FinanceToolDefinition {
  name: FinanceToolName;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export const FINANCE_TOOL_DEFINITIONS: FinanceToolDefinition[] = [
  {
    name: 'getTransactions',
    description: 'Fetch user transactions optionally filtered by date range.',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'ISO date start' },
        to: { type: 'string', description: 'ISO date end' },
        limit: { type: 'number', description: 'Max rows' },
      },
    },
  },
  {
    name: 'getAccountBalances',
    description: 'Fetch current balances for all user accounts.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getMonthlyExpenses',
    description: 'Monthly income/expense aggregates.',
    parameters: {
      type: 'object',
      properties: {
        months: { type: 'number', description: 'Lookback months' },
      },
    },
  },
  {
    name: 'getCategorySpending',
    description: 'Spending totals grouped by category.',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
      },
    },
  },
  {
    name: 'getBudgetStatus',
    description: 'Current budget utilization.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getGoals',
    description: 'List savings/investment goals and progress.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'calculateGoalContribution',
    description: 'Compute required/suggested monthly contribution for a goal.',
    parameters: {
      type: 'object',
      properties: {
        goalId: { type: 'string', description: 'Goal id' },
      },
      required: ['goalId'],
    },
  },
  {
    name: 'getInvestmentSummary',
    description: 'Portfolio invested vs current value summary.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'calculateSavingsRate',
    description: 'Compute savings rate from income and expenses.',
    parameters: {
      type: 'object',
      properties: {
        months: { type: 'number' },
      },
    },
  },
  {
    name: 'detectRecurringExpenses',
    description: 'Detect recurring merchants/subscriptions.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'detectUnusualTransactions',
    description: 'Flag unusual/outlier transactions.',
    parameters: {
      type: 'object',
      properties: {
        lookbackDays: { type: 'number' },
      },
    },
  },
  {
    name: 'generateFinancialSummary',
    description: 'High-level financial snapshot for the user.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'forecastCashFlow',
    description: 'Forward-looking cash-flow projection from historical data.',
    parameters: {
      type: 'object',
      properties: {
        months: { type: 'number' },
      },
    },
  },
];

const INTENT_TOOL_MAP: Record<FinanceIntent, FinanceToolName[]> = {
  spending_summary: ['getMonthlyExpenses', 'getCategorySpending'],
  budget_status: ['getBudgetStatus'],
  goal_progress: ['getGoals'],
  goal_contribution: ['getGoals', 'calculateGoalContribution'],
  investment_summary: ['getInvestmentSummary'],
  cash_flow_forecast: ['forecastCashFlow', 'getMonthlyExpenses'],
  unusual_transactions: ['detectUnusualTransactions'],
  recurring_expenses: ['detectRecurringExpenses'],
  savings_rate: ['calculateSavingsRate'],
  account_balances: ['getAccountBalances'],
  category_spending: ['getCategorySpending'],
  transactions_lookup: ['getTransactions'],
  financial_overview: ['generateFinancialSummary', 'getBudgetStatus', 'getGoals'],
  general_question: ['generateFinancialSummary'],
  action_request: [],
};

export function selectToolsForIntent(
  intent: FinanceIntent,
  entities: { goalId?: string; months?: number } = {}
): ToolCallRequest[] {
  const names = INTENT_TOOL_MAP[intent] ?? ['generateFinancialSummary'];
  return names.map((name) => {
    const args: Record<string, unknown> = {};
    if (name === 'calculateGoalContribution' && entities.goalId) {
      args.goalId = entities.goalId;
    }
    if (
      (name === 'getMonthlyExpenses' ||
        name === 'calculateSavingsRate' ||
        name === 'forecastCashFlow') &&
      entities.months
    ) {
      args.months = entities.months;
    }
    return { name, args: Object.keys(args).length ? args : undefined };
  });
}
