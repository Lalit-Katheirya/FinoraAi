/**
 * Money helpers — all amounts stored as numbers in major currency units (e.g. INR rupees).
 * Calculations should use these helpers rather than LLM arithmetic.
 */
export function roundMoney(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function percentOf(part: number, whole: number): number {
  if (whole === 0) return 0;
  return roundMoney((part / whole) * 100, 1);
}

export function savingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return percentOf(income - expenses, income);
}

export function profitLoss(invested: number, current: number): number {
  return roundMoney(current - invested);
}

export function returnPercent(invested: number, current: number): number {
  if (invested <= 0) return 0;
  return percentOf(current - invested, invested);
}

export function requiredMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  monthsRemaining: number
): number {
  if (monthsRemaining <= 0) return Math.max(0, targetAmount - currentAmount);
  return roundMoney((targetAmount - currentAmount) / monthsRemaining);
}

export function formatCurrency(
  amount: number,
  currency = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
