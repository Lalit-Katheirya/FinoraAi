import type {
  FinanceToolContext,
  ToolCallRequest,
  ToolCallResult,
} from './types';

function isEmptyData(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    const values = Object.values(data as Record<string, unknown>);
    if (values.length === 0) return true;
    // Common summary shapes with all-zero / empty holdings
    if (
      'holdings' in (data as object) &&
      Array.isArray((data as { holdings: unknown[] }).holdings) &&
      (data as { holdings: unknown[] }).holdings.length === 0 &&
      Number((data as { totalInvested?: number }).totalInvested ?? 0) === 0
    ) {
      return true;
    }
    if (
      'points' in (data as object) &&
      Array.isArray((data as { points: unknown[] }).points) &&
      (data as { points: unknown[] }).points.length === 0
    ) {
      return true;
    }
  }
  return false;
}

function asNumber(value: unknown, fallback?: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export async function executeToolCall(
  context: FinanceToolContext,
  call: ToolCallRequest
): Promise<ToolCallResult> {
  try {
    const data = await dispatch(context, call);
    return {
      name: call.name,
      ok: true,
      data,
      empty: isEmptyData(data),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    return {
      name: call.name,
      ok: false,
      data: null,
      error: message,
      empty: true,
    };
  }
}

export async function executeToolCalls(
  context: FinanceToolContext,
  calls: ToolCallRequest[]
): Promise<ToolCallResult[]> {
  return Promise.all(calls.map((call) => executeToolCall(context, call)));
}

async function dispatch(
  context: FinanceToolContext,
  call: ToolCallRequest
): Promise<unknown> {
  const args = call.args ?? {};

  switch (call.name) {
    case 'getTransactions':
      return context.getTransactions({
        from: asString(args.from),
        to: asString(args.to),
        limit: asNumber(args.limit),
      });
    case 'getAccountBalances':
      return context.getAccountBalances();
    case 'getMonthlyExpenses':
      return context.getMonthlyExpenses(asNumber(args.months));
    case 'getCategorySpending':
      return context.getCategorySpending({
        from: asString(args.from),
        to: asString(args.to),
      });
    case 'getBudgetStatus':
      return context.getBudgetStatus();
    case 'getGoals':
      return context.getGoals();
    case 'calculateGoalContribution': {
      const goalId = asString(args.goalId);
      if (!goalId) {
        // Prefer first goal when id omitted
        const goals = await context.getGoals();
        if (!goals.length) return null;
        return context.calculateGoalContribution(goals[0].id);
      }
      return context.calculateGoalContribution(goalId);
    }
    case 'getInvestmentSummary':
      return context.getInvestmentSummary();
    case 'calculateSavingsRate':
      return context.calculateSavingsRate(asNumber(args.months));
    case 'detectRecurringExpenses':
      return context.detectRecurringExpenses();
    case 'detectUnusualTransactions':
      return context.detectUnusualTransactions(asNumber(args.lookbackDays));
    case 'generateFinancialSummary':
      return context.generateFinancialSummary();
    case 'forecastCashFlow':
      return context.forecastCashFlow(asNumber(args.months));
    default: {
      const exhaustive: never = call.name;
      throw new Error(`Unknown tool: ${String(exhaustive)}`);
    }
  }
}

export function allToolsEmpty(results: ToolCallResult[]): boolean {
  if (results.length === 0) return true;
  return results.every((r) => !r.ok || r.empty);
}

export function collectAuthoritativeNumbers(
  results: ToolCallResult[]
): Array<{ label: string; value: number; currency?: string }> {
  const numbers: Array<{ label: string; value: number; currency?: string }> = [];

  for (const result of results) {
    if (!result.ok || result.empty || result.data === null) continue;
    const data = result.data;

    if (result.name === 'calculateSavingsRate' && isRecord(data)) {
      pushNumber(numbers, 'Income', data.income);
      pushNumber(numbers, 'Expenses', data.expenses);
      pushNumber(numbers, 'Savings', data.savings);
      pushNumber(numbers, 'Savings rate %', data.savingsRatePercent);
    }

    if (result.name === 'getInvestmentSummary' && isRecord(data)) {
      pushNumber(numbers, 'Total invested', data.totalInvested);
      pushNumber(numbers, 'Current value', data.currentValue);
      pushNumber(numbers, 'Profit / loss', data.profitLoss);
      pushNumber(numbers, 'Return %', data.returnPercent);
    }

    if (result.name === 'generateFinancialSummary' && isRecord(data)) {
      const currency = asString(data.currency);
      pushNumber(numbers, 'Total balance', data.totalBalance, currency);
      pushNumber(numbers, 'Monthly income', data.monthlyIncome, currency);
      pushNumber(numbers, 'Monthly expenses', data.monthlyExpenses, currency);
      pushNumber(numbers, 'Savings', data.savings, currency);
      pushNumber(numbers, 'Investments', data.investments, currency);
    }

    if (result.name === 'calculateGoalContribution' && isRecord(data)) {
      pushNumber(numbers, 'Required monthly', data.requiredMonthly);
      pushNumber(numbers, 'Suggested monthly', data.suggestedMonthly);
      pushNumber(numbers, 'Progress %', data.progressPercent);
      pushNumber(numbers, 'Shortfall', data.shortfall);
    }

    if (result.name === 'getAccountBalances' && Array.isArray(data)) {
      for (const account of data) {
        if (!isRecord(account)) continue;
        const name = asString(account.name) ?? 'Account';
        pushNumber(
          numbers,
          `${name} balance`,
          account.currentBalance,
          asString(account.currency)
        );
      }
    }

    if (result.name === 'getBudgetStatus' && Array.isArray(data)) {
      for (const budget of data) {
        if (!isRecord(budget)) continue;
        const name = asString(budget.name) ?? 'Budget';
        pushNumber(numbers, `${name} spent`, budget.spent);
        pushNumber(numbers, `${name} remaining`, budget.remaining);
        pushNumber(numbers, `${name} % used`, budget.percentUsed);
      }
    }
  }

  return numbers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pushNumber(
  target: Array<{ label: string; value: number; currency?: string }>,
  label: string,
  value: unknown,
  currency?: string
): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    target.push({ label, value, currency });
  }
}
