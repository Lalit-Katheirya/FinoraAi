import {
  collectAuthoritativeNumbers,
  createLLMProvider,
  runFinanceChat,
  type FinanceToolContext,
  type ToolCallResult,
} from '..';

function contextWithSavings(): FinanceToolContext {
  return {
    userId: 'user-calc-1',
    getTransactions: async () => [],
    getAccountBalances: async () => [],
    getMonthlyExpenses: async () => [],
    getCategorySpending: async () => [],
    getBudgetStatus: async () => [],
    getGoals: async () => [],
    calculateGoalContribution: async () => null,
    getInvestmentSummary: async () => ({
      totalInvested: 100000,
      currentValue: 112500,
      profitLoss: 12500,
      returnPercent: 12.5,
      holdings: [],
    }),
    calculateSavingsRate: async () => ({
      income: 100000,
      expenses: 65000,
      savings: 35000,
      savingsRatePercent: 35,
    }),
    detectRecurringExpenses: async () => [],
    detectUnusualTransactions: async () => [],
    generateFinancialSummary: async () => ({
      totalBalance: 250000,
      monthlyIncome: 100000,
      monthlyExpenses: 65000,
      savings: 35000,
      investments: 112500,
      currency: 'INR',
    }),
    forecastCashFlow: async () => ({
      points: [
        {
          month: '2026-10',
          projectedIncome: 100000,
          projectedExpenses: 65000,
          projectedNet: 35000,
        },
      ],
      assumptions: ['Based on last 3 months average'],
    }),
  };
}

describe('calculations — tool-based numbers preferred', () => {
  const llm = createLLMProvider({ provider: 'mock' });

  it('surfaces savings rate from calculateSavingsRate tool', async () => {
    const result = await runFinanceChat(
      { message: 'What is my savings rate?' },
      contextWithSavings(),
      { llm }
    );

    expect(result.meta.intent).toBe('savings_rate');
    expect(result.meta.toolsUsed).toContain('calculateSavingsRate');
    expect(result.response.text).not.toContain(
      "I don't have enough data to answer that accurately."
    );

    const rate = result.response.numbers?.find(
      (n) =>
        n.label.toLowerCase().includes('savings rate') ||
        n.label.toLowerCase().includes('savingsratepercent')
    );
    expect(rate?.value).toBe(35);

    const income = result.response.numbers?.find((n) =>
      n.label.toLowerCase().includes('income')
    );
    expect(income?.value).toBe(100000);
  });

  it('collectAuthoritativeNumbers prefers tool figures', () => {
    const results: ToolCallResult[] = [
      {
        name: 'calculateSavingsRate',
        ok: true,
        empty: false,
        data: {
          income: 100000,
          expenses: 65000,
          savings: 35000,
          savingsRatePercent: 35,
        },
      },
    ];

    const numbers = collectAuthoritativeNumbers(results);
    expect(numbers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Savings rate %', value: 35 }),
        expect.objectContaining({ label: 'Income', value: 100000 }),
        expect.objectContaining({ label: 'Expenses', value: 65000 }),
      ])
    );
  });

  it('uses investment summary tool totals', async () => {
    const result = await runFinanceChat(
      { message: 'How are my investments doing?' },
      contextWithSavings(),
      { llm }
    );

    expect(result.meta.toolsUsed).toContain('getInvestmentSummary');
    const current = result.response.numbers?.find((n) =>
      n.label.toLowerCase().includes('current')
    );
    expect(current?.value).toBe(112500);
  });

  it('does not invent numbers when investment holdings empty and zeros', async () => {
    const emptyInvestments: FinanceToolContext = {
      ...contextWithSavings(),
      getInvestmentSummary: async () => ({
        totalInvested: 0,
        currentValue: 0,
        profitLoss: 0,
        returnPercent: 0,
        holdings: [],
      }),
    };

    const result = await runFinanceChat(
      { message: 'Show my investment portfolio' },
      emptyInvestments,
      { llm }
    );

    expect(result.response.text).toContain(
      "I don't have enough data to answer that accurately."
    );
  });
});
