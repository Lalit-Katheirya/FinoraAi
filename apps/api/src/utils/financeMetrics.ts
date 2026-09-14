import {
  addMonths,
  monthsBetween,
  percentOf,
  profitLoss,
  requiredMonthlyContribution,
  returnPercent,
  roundMoney,
  toISODate,
} from '@finora/shared';

export function computeGoalMetrics(input: {
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const monthsRemaining = Math.max(1, monthsBetween(now, input.targetDate));
  const requiredMonthly = requiredMonthlyContribution(
    input.targetAmount,
    input.currentAmount,
    monthsRemaining
  );
  const progressPercent = percentOf(input.currentAmount, input.targetAmount);
  const remaining = Math.max(0, input.targetAmount - input.currentAmount);
  const shortfall = roundMoney(Math.max(0, requiredMonthly - input.monthlyContribution));
  const suggestedMonthly = roundMoney(Math.max(requiredMonthly, input.monthlyContribution));

  let expectedCompletionDate: string | undefined;
  if (input.monthlyContribution > 0 && remaining > 0) {
    const monthsNeeded = Math.ceil(remaining / input.monthlyContribution);
    expectedCompletionDate = toISODate(addMonths(now, monthsNeeded));
  } else if (remaining <= 0) {
    expectedCompletionDate = toISODate(now);
  }

  return {
    progressPercent,
    requiredMonthly,
    shortfall,
    suggestedMonthly,
    expectedCompletionDate,
  };
}

export function computeInvestmentMetrics(investedAmount: number, currentValue: number) {
  return {
    profitLoss: profitLoss(investedAmount, currentValue),
    returnPercent: returnPercent(investedAmount, currentValue),
  };
}
