import { z } from 'zod';

export const financeIntentSchema = z.enum([
  'spending_summary',
  'budget_status',
  'goal_progress',
  'goal_contribution',
  'investment_summary',
  'cash_flow_forecast',
  'unusual_transactions',
  'recurring_expenses',
  'savings_rate',
  'account_balances',
  'category_spending',
  'transactions_lookup',
  'financial_overview',
  'tax_guidance',
  'market_guidance',
  'ca_planning',
  'general_question',
  'action_request',
]);

export type FinanceIntent = z.infer<typeof financeIntentSchema>;

export const intentDetectionSchema = z.object({
  intent: financeIntentSchema,
  confidence: z.number().min(0).max(1),
  requiresConfirmation: z.boolean().default(false),
  requestedAction: z
    .enum(['transfer', 'payment', 'upi', 'trade', 'none'])
    .default('none'),
  entities: z
    .object({
      category: z.string().optional(),
      goalId: z.string().optional(),
      goalName: z.string().optional(),
      months: z.number().int().positive().optional(),
      accountId: z.string().optional(),
      country: z.string().optional(),
    })
    .default({}),
  rationale: z.string().optional(),
});

export type IntentDetectionResult = z.infer<typeof intentDetectionSchema>;

const ACTION_KEYWORDS =
  /\b(transfer|send money|pay\b|upi|neft|imps|rtgs|buy stock|sell stock|place order|execute trade)\b/i;

export function detectIntentHeuristic(message: string): IntentDetectionResult {
  const lower = message.toLowerCase();

  if (ACTION_KEYWORDS.test(message)) {
    return {
      intent: 'action_request',
      confidence: 0.95,
      requiresConfirmation: true,
      requestedAction: /\b(upi|pay)\b/i.test(message)
        ? 'upi'
        : /\b(buy|sell|trade|stock)\b/i.test(message)
          ? 'trade'
          : 'transfer',
      entities: {},
      rationale: 'User appears to request an executable financial action.',
    };
  }

  if (
    /\b(tax|itr|tds|gst|80c|80d|ltcg|stcg|deduction|rebate|advance tax|form\s*16|ay\b|fy\b|capital gains|income tax)\b/.test(
      lower
    )
  ) {
    return intent('tax_guidance', 0.9);
  }
  if (
    /\b(stock market|share market|nifty|sensex|mutual[\s-]?fund|sip|equity|ipo|portfolio allocation|bull|bear)\b/.test(
      lower
    )
  ) {
    return intent('market_guidance', 0.85);
  }
  if (
    /\b(chartered accountant|\bca\b|cfo|financial plan|wealth plan|tax plan|retirement plan)\b/.test(
      lower
    )
  ) {
    return intent('ca_planning', 0.85);
  }
  if (/\b(unusual|anomaly|outlier|suspicious)\b/.test(lower)) {
    return intent('unusual_transactions', 0.85);
  }
  if (/\b(recurring|subscription|bills?\b|emi)\b/.test(lower)) {
    return intent('recurring_expenses', 0.85);
  }
  if (/\b(forecast|cash\s*flow|predict|projection)\b/.test(lower)) {
    return intent('cash_flow_forecast', 0.85);
  }
  if (/\b(savings?\s*rate|how much.*(save|saving))\b/.test(lower)) {
    return intent('savings_rate', 0.85);
  }
  if (/\b(invest|portfolio|mutual[\s-]?fund|stocks?)/.test(lower)) {
    return intent('investment_summary', 0.8);
  }
  if (/\b(budget)\b/.test(lower)) {
    return intent('budget_status', 0.85);
  }
  if (/\b(goal|target).*(contribu|save|monthly)|contribu.*goal\b/.test(lower)) {
    return intent('goal_contribution', 0.8);
  }
  if (/\b(goal|target)\b/.test(lower)) {
    return intent('goal_progress', 0.8);
  }
  if (/\b(balance|account)\b/.test(lower)) {
    return intent('account_balances', 0.8);
  }
  if (/\b(category|spend(ing)? on)\b/.test(lower)) {
    return intent('category_spending', 0.75);
  }
  if (/\b(transaction|expense|spend|spent|outflow)\b/.test(lower)) {
    return intent('spending_summary', 0.75);
  }
  if (/\b(summary|overview|how am i doing|financial health)\b/.test(lower)) {
    return intent('financial_overview', 0.8);
  }

  return intent('general_question', 0.55);
}

function intent(
  value: FinanceIntent,
  confidence: number
): IntentDetectionResult {
  return {
    intent: value,
    confidence,
    requiresConfirmation: false,
    requestedAction: 'none',
    entities: {},
  };
}
