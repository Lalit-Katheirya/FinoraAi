import type { FinanceIntent } from '../schemas/intent.schema';
import type { UserPreferenceMemory } from '../memory/preferences';

export function buildFinancePrompt(input: {
  intent: FinanceIntent;
  userMessage: string;
  toolResultsJson: string;
  preferences?: UserPreferenceMemory;
  permissionDenied?: boolean;
}): string {
  const prefs = input.preferences
    ? `User preferences (non-financial vectors only): ${JSON.stringify(input.preferences)}`
    : 'No stored interaction preferences.';

  if (input.permissionDenied) {
    return `
The user asked: "${input.userMessage}"
Detected intent: ${input.intent}

Permission check FAILED: Finora cannot execute transfers, payments, UPI, or trades.
Explain that you cannot perform the action, summarize what they asked for informationally if possible,
and ask them to confirm and complete the action themselves in their banking or brokerage app.
Do not invent balances or quote fabricated amounts.
`.trim();
  }

  return `
Detected intent: ${input.intent}
User message: "${input.userMessage}"

${prefs}

Tool results (authoritative — do not invent beyond this JSON):
${input.toolResultsJson}

Instructions:
- Ground every number in the tool results above.
- If results are empty or lack the needed fields, set insufficientData=true and use the insufficient-data message.
- Prefer presenting tool numbers in the "numbers" and "tables" fields.
- Keep recommendations high-level and non-guaranteed.
`.trim();
}

export const INTENT_PROMPT_HINTS: Record<FinanceIntent, string> = {
  spending_summary: 'Summarize expenses using monthly and category tool data.',
  budget_status: 'Report budget used vs remaining from budget tools only.',
  goal_progress: 'Report goal progress from goal tools only.',
  goal_contribution: 'Use calculateGoalContribution output for monthly figures.',
  investment_summary: 'Use investment summary totals; never invent returns.',
  cash_flow_forecast: 'Present forecast points and list assumptions from the tool.',
  unusual_transactions: 'List unusual transactions returned by the detector tool.',
  recurring_expenses: 'List recurring expenses from the detector tool.',
  savings_rate: 'Use calculateSavingsRate; do not recompute.',
  account_balances: 'List balances from getAccountBalances only.',
  category_spending: 'Break down spending by category from tools.',
  transactions_lookup: 'Summarize matching transactions from tools.',
  financial_overview: 'Use generateFinancialSummary as the primary source.',
  general_question: 'Answer only with available tool data; otherwise insufficient data.',
  action_request: 'Refuse execution; offer informational guidance only.',
};
