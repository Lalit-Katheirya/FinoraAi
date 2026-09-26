import type { FinanceIntent } from '../schemas/intent.schema';
import type { UserPreferenceMemory } from '../memory/preferences';

const KNOWLEDGE_INTENTS: FinanceIntent[] = [
  'tax_guidance',
  'market_guidance',
  'ca_planning',
  'general_question',
];

export function isKnowledgeIntent(intent: FinanceIntent): boolean {
  return KNOWLEDGE_INTENTS.includes(intent);
}

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

  const knowledgeMode = isKnowledgeIntent(input.intent);

  return `
Detected intent: ${input.intent}
Intent hint: ${INTENT_PROMPT_HINTS[input.intent]}
User message: "${input.userMessage}"

${prefs}

Tool results (authoritative for the user's personal numbers — do not invent beyond this JSON):
${input.toolResultsJson}

Role: personal CA-style finance manager.
Instructions:
- Ground every personal money figure in the tool results above.
- ${
    knowledgeMode
      ? 'If tools are empty, you may still answer educational tax/market/CA questions without inventing the user\'s balances. Clearly separate education from personalization.'
      : 'If results are empty or lack the needed fields for this personal-data question, set insufficientData=true and use the insufficient-data message.'
  }
- Prefer presenting tool numbers in the "numbers" and "tables" fields.
- For India tax topics, reference common concepts (slabs, FY/AY, 80C/80D, LTCG/STCG, TDS, GST basics) carefully and note that rules change by year.
- For other countries, give high-level comparisons and recommend verifying local law.
- Keep recommendations practical, non-guaranteed, and framed as options a CA might discuss — not a formal opinion or filing.
`.trim();
}

export const INTENT_PROMPT_HINTS: Record<FinanceIntent, string> = {
  spending_summary: 'Summarize expenses using monthly and category tool data like a CA expense note.',
  budget_status: 'Report budget used vs remaining from budget tools only.',
  goal_progress: 'Report goal progress from goal tools only.',
  goal_contribution: 'Use calculateGoalContribution output for monthly figures.',
  investment_summary: 'Use investment summary totals; never invent returns. Explain allocation in plain CA language.',
  cash_flow_forecast: 'Present forecast points and list assumptions from the tool.',
  unusual_transactions: 'List unusual transactions returned by the detector tool.',
  recurring_expenses: 'List recurring expenses from the detector tool.',
  savings_rate: 'Use calculateSavingsRate; do not recompute.',
  account_balances: 'List balances from getAccountBalances only.',
  category_spending: 'Break down spending by category from tools.',
  transactions_lookup: 'Summarize matching transactions from tools.',
  financial_overview: 'Use generateFinancialSummary as the primary source; give a CA-style health check.',
  tax_guidance:
    'Answer as a CA educator on tax concepts (prefer India unless another country is named). Use tool data only if personalizing.',
  market_guidance:
    'Explain stock/mutual-fund/market concepts carefully without guaranteed returns. Use holdings tools when available.',
  ca_planning:
    'Provide CA-style planning steps (cashflow, deductions, goals, risk). Use personal tool data when present.',
  general_question:
    'Act as personal CA/CFO. Use tools for personal numbers; otherwise give careful educational guidance.',
  action_request: 'Refuse execution; offer informational guidance only.',
};
