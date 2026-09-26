import type {
  AccountDto,
  BudgetDto,
  GoalDto,
  InvestmentDto,
  RecurringExpenseDto,
  TransactionDto,
} from '@finora/shared';

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface CategorySpendingItem {
  categoryId?: string;
  categoryName: string;
  amount: number;
  transactionCount: number;
}

export interface MonthlyExpenseSummary {
  month: string;
  totalExpenses: number;
  totalIncome: number;
  net: number;
}

export interface GoalContributionResult {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  requiredMonthly: number;
  suggestedMonthly: number;
  shortfall: number;
  progressPercent: number;
}

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  returnPercent: number;
  holdings: InvestmentDto[];
}

export interface SavingsRateResult {
  income: number;
  expenses: number;
  savings: number;
  savingsRatePercent: number;
}

export interface UnusualTransaction {
  transaction: TransactionDto;
  reason: string;
  score: number;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  investments: number;
  currency?: string;
}

export interface CashFlowForecastPoint {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNet: number;
}

export interface CashFlowForecast {
  points: CashFlowForecastPoint[];
  assumptions: string[];
}

/**
 * Injected data accessors for the finance agent.
 * Implementations live in apps/backend — this package never talks to the DB directly.
 */
export interface FinanceToolContext {
  userId: string;
  getTransactions(filter?: DateRangeFilter & { limit?: number }): Promise<TransactionDto[]>;
  getAccountBalances(): Promise<AccountDto[]>;
  getMonthlyExpenses(months?: number): Promise<MonthlyExpenseSummary[]>;
  getCategorySpending(filter?: DateRangeFilter): Promise<CategorySpendingItem[]>;
  getBudgetStatus(): Promise<BudgetDto[]>;
  getGoals(): Promise<GoalDto[]>;
  calculateGoalContribution(goalId: string): Promise<GoalContributionResult | null>;
  getInvestmentSummary(): Promise<InvestmentSummary>;
  calculateSavingsRate(months?: number): Promise<SavingsRateResult>;
  detectRecurringExpenses(): Promise<RecurringExpenseDto[]>;
  detectUnusualTransactions(lookbackDays?: number): Promise<UnusualTransaction[]>;
  generateFinancialSummary(): Promise<FinancialSummary>;
  forecastCashFlow(months?: number): Promise<CashFlowForecast>;
}

export type FinanceToolName =
  | 'getTransactions'
  | 'getAccountBalances'
  | 'getMonthlyExpenses'
  | 'getCategorySpending'
  | 'getBudgetStatus'
  | 'getGoals'
  | 'calculateGoalContribution'
  | 'getInvestmentSummary'
  | 'calculateSavingsRate'
  | 'detectRecurringExpenses'
  | 'detectUnusualTransactions'
  | 'generateFinancialSummary'
  | 'forecastCashFlow';

export interface ToolCallRequest {
  name: FinanceToolName;
  args?: Record<string, unknown>;
}

export interface ToolCallResult {
  name: FinanceToolName;
  ok: boolean;
  data: unknown;
  error?: string;
  empty: boolean;
}
