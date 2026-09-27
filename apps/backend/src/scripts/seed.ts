import argon2 from 'argon2';
import { addMonths, CATEGORY_NAMES, startOfMonth, toISODate } from '@finora/shared';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../config/logger';
import {
  Account,
  Budget,
  Category,
  Goal,
  Investment,
  RecurringExpense,
  Transaction,
  User,
} from '../models';
import { buildDuplicateHash } from '../utils/duplicateHash';
import { categoryService } from '../services/category.service';

const DEMO_EMAIL = 'demo@finora.ai';
const DEMO_PASSWORD = 'Demo@12345';

function parseSeedEmail(): string {
  const arg = process.argv.find((a) => a.startsWith('--email='));
  if (arg) return arg.slice('--email='.length).trim().toLowerCase();
  const envEmail = process.env.SEED_EMAIL?.trim();
  if (envEmail) return envEmail.toLowerCase();
  return DEMO_EMAIL;
}

interface SeedTx {
  accountKey: 'salary' | 'savings' | 'credit';
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  merchant: string;
  categoryName: string;
  daysAgo: number;
  paymentMethod?: 'upi' | 'card' | 'netbanking' | 'cash';
}

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

async function clearUserFinanceData(uid: unknown): Promise<void> {
  await Promise.all([
    Account.deleteMany({ userId: uid }),
    Transaction.deleteMany({ userId: uid }),
    Budget.deleteMany({ userId: uid }),
    Goal.deleteMany({ userId: uid }),
    Investment.deleteMany({ userId: uid }),
    RecurringExpense.deleteMany({ userId: uid }),
  ]);
}

async function seed(): Promise<void> {
  await connectDatabase();

  const targetEmail = parseSeedEmail();
  const isDemoTarget = targetEmail === DEMO_EMAIL;

  await categoryService.ensureSystemSeeded();
  const categories = await Category.find({ isSystem: true }).exec();
  const categoryByName = new Map(
    categories.map((c) => [String(c.name), String(c._id)])
  );

  let user = await User.findOne({ email: targetEmail });

  if (user) {
    await clearUserFinanceData(user._id);
    user.monthlyIncome = 185000;
    user.currency = user.currency || 'INR';
    user.timezone = user.timezone || 'Asia/Kolkata';
    if (!user.financialPreferences) {
      user.financialPreferences = {
        riskTolerance: 'moderate',
        savingsTargetPercent: 30,
      };
    }
    await user.save();
  } else if (isDemoTarget) {
    const passwordHash = await argon2.hash(DEMO_PASSWORD);
    user = await User.create({
      name: 'Demo User',
      email: DEMO_EMAIL,
      passwordHash,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      monthlyIncome: 185000,
      isDemo: true,
      financialPreferences: {
        riskTolerance: 'moderate',
        savingsTargetPercent: 30,
      },
    });
  } else {
    throw new Error(
      `User not found for email "${targetEmail}". Register/login first, then re-run seed with --email=`
    );
  }

  const userId = String(user._id);

  const [salaryAccount, savingsAccount, creditAccount] = await Account.create([
    {
      userId,
      name: 'HDFC Salary Account',
      type: 'bank',
      institution: 'HDFC Bank',
      accountNumberMasked: 'XXXX4521',
      currentBalance: 248500,
      availableBalance: 248500,
      currency: 'INR',
      isActive: true,
    },
    {
      userId,
      name: 'SBI Savings',
      type: 'bank',
      institution: 'State Bank of India',
      accountNumberMasked: 'XXXX8890',
      currentBalance: 412000,
      availableBalance: 412000,
      currency: 'INR',
      isActive: true,
    },
    {
      userId,
      name: 'Axis Ace Credit Card',
      type: 'credit_card',
      institution: 'Axis Bank',
      accountNumberMasked: 'XXXX3312',
      currentBalance: -18540,
      availableBalance: 81460,
      currency: 'INR',
      isActive: true,
    },
  ]);

  const accountIds = {
    salary: String(salaryAccount._id),
    savings: String(savingsAccount._id),
    credit: String(creditAccount._id),
  };

  const merchants: SeedTx[] = [];

  // 3 months of salary
  for (const monthOffset of [0, 1, 2]) {
    const dayOfMonth = 1;
    const ref = startOfMonth(addMonths(new Date(), -monthOffset));
    ref.setDate(dayOfMonth);
    const ago = Math.round(
      (Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24)
    );
    merchants.push({
      accountKey: 'salary',
      type: 'income',
      amount: 185000,
      merchant: 'ACME Corp Payroll',
      categoryName: 'Salary',
      daysAgo: Math.max(0, ago),
      paymentMethod: 'netbanking',
    });
  }

  const recurringMonthly: Array<Omit<SeedTx, 'daysAgo' | 'accountKey'> & { day: number }> = [
    { type: 'expense', amount: 35000, merchant: 'Landlord Rent', categoryName: 'Rent', day: 3, paymentMethod: 'upi' },
    { type: 'expense', amount: 2499, merchant: 'Jio Fiber', categoryName: 'Utilities', day: 5, paymentMethod: 'upi' },
    { type: 'expense', amount: 649, merchant: 'Netflix', categoryName: 'Subscriptions', day: 8, paymentMethod: 'card' },
    { type: 'expense', amount: 119, merchant: 'Spotify', categoryName: 'Subscriptions', day: 8, paymentMethod: 'card' },
    { type: 'expense', amount: 18500, merchant: 'HDFC Home Loan EMI', categoryName: 'EMI', day: 7, paymentMethod: 'netbanking' },
    { type: 'expense', amount: 4200, merchant: 'LIC Premium', categoryName: 'Insurance', day: 12, paymentMethod: 'netbanking' },
  ];

  for (const monthOffset of [0, 1, 2]) {
    for (const item of recurringMonthly) {
      const ref = startOfMonth(addMonths(new Date(), -monthOffset));
      ref.setDate(item.day);
      const ago = Math.round(
        (Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (ago < 0) continue;
      merchants.push({
        accountKey: 'salary',
        type: item.type,
        amount: item.amount,
        merchant: item.merchant,
        categoryName: item.categoryName,
        daysAgo: ago,
        paymentMethod: item.paymentMethod,
      });
    }
  }

  const variable: Array<{ merchant: string; category: string; min: number; max: number; count: number; account: 'salary' | 'credit' }> = [
    { merchant: 'Swiggy', category: 'Food', min: 180, max: 650, count: 18, account: 'salary' },
    { merchant: 'Zomato', category: 'Food', min: 200, max: 800, count: 12, account: 'credit' },
    { merchant: 'BigBasket', category: 'Groceries', min: 1200, max: 4500, count: 9, account: 'salary' },
    { merchant: 'Blinkit', category: 'Groceries', min: 150, max: 900, count: 10, account: 'salary' },
    { merchant: 'Uber', category: 'Transport', min: 120, max: 550, count: 20, account: 'salary' },
    { merchant: 'Indian Oil', category: 'Fuel', min: 1500, max: 3500, count: 6, account: 'credit' },
    { merchant: 'Amazon', category: 'Shopping', min: 499, max: 8999, count: 8, account: 'credit' },
    { merchant: 'Myntra', category: 'Shopping', min: 799, max: 4999, count: 4, account: 'credit' },
    { merchant: 'Apollo Pharmacy', category: 'Healthcare', min: 250, max: 2200, count: 5, account: 'salary' },
    { merchant: 'PVR Cinemas', category: 'Entertainment', min: 400, max: 1800, count: 4, account: 'credit' },
    { merchant: 'IRCTC', category: 'Travel', min: 1200, max: 6500, count: 3, account: 'salary' },
  ];

  let seedCounter = 0;
  for (const v of variable) {
    for (let i = 0; i < v.count; i += 1) {
      seedCounter += 1;
      const amount =
        Math.round((v.min + ((v.max - v.min) * ((seedCounter * 37) % 100)) / 100) * 100) /
        100;
      const daysAgo = (seedCounter * 3) % 90;
      merchants.push({
        accountKey: v.account,
        type: 'expense',
        amount,
        merchant: v.merchant,
        categoryName: v.category,
        daysAgo,
        paymentMethod: v.account === 'credit' ? 'card' : 'upi',
      });
    }
  }

  // savings transfers
  for (const monthOffset of [0, 1, 2]) {
    const ref = startOfMonth(addMonths(new Date(), -monthOffset));
    ref.setDate(25);
    const ago = Math.round(
      (Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (ago < 0) continue;
    merchants.push({
      accountKey: 'salary',
      type: 'transfer',
      amount: 40000,
      merchant: 'Transfer to SBI Savings',
      categoryName: 'Transfer',
      daysAgo: ago,
      paymentMethod: 'netbanking',
    });
  }

  const txDocs = merchants.map((m) => {
    const date = daysAgoDate(m.daysAgo);
    const accountId = accountIds[m.accountKey];
    const duplicateHash = buildDuplicateHash(
      toISODate(date),
      m.amount,
      m.merchant,
      accountId
    );
    return {
      userId,
      accountId,
      type: m.type,
      amount: m.amount,
      currency: 'INR',
      categoryId: categoryByName.get(m.categoryName),
      categoryName: m.categoryName,
      merchant: m.merchant,
      description: `${m.merchant} payment`,
      transactionDate: date,
      paymentMethod: m.paymentMethod ?? 'upi',
      source: 'manual',
      tags: m.type === 'expense' ? ['demo'] : ['demo', 'income'],
      confidenceScore: 0.95,
      classificationSource: 'rule',
      isReviewed: true,
      duplicateHash,
    };
  });

  await Transaction.insertMany(txDocs);

  const monthStart = startOfMonth(new Date());
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

  await Budget.create([
    {
      userId,
      name: 'Food & Dining',
      period: 'monthly',
      categoryId: categoryByName.get('Food'),
      amount: 12000,
      currency: 'INR',
      startDate: monthStart,
      endDate: monthEnd,
      alertThresholds: [50, 75, 90, 100],
    },
    {
      userId,
      name: 'Groceries',
      period: 'monthly',
      categoryId: categoryByName.get('Groceries'),
      amount: 10000,
      currency: 'INR',
      startDate: monthStart,
      endDate: monthEnd,
      alertThresholds: [50, 75, 90, 100],
    },
    {
      userId,
      name: 'Shopping',
      period: 'monthly',
      categoryId: categoryByName.get('Shopping'),
      amount: 15000,
      currency: 'INR',
      startDate: monthStart,
      endDate: monthEnd,
      alertThresholds: [50, 75, 90, 100],
    },
  ]);

  await Goal.create([
    {
      userId,
      name: 'Emergency Fund',
      targetAmount: 600000,
      currentAmount: 280000,
      targetDate: addMonths(new Date(), 12),
      monthlyContribution: 25000,
      priority: 'high',
      category: 'Savings',
    },
    {
      userId,
      name: 'Japan Trip 2027',
      targetAmount: 350000,
      currentAmount: 85000,
      targetDate: addMonths(new Date(), 14),
      monthlyContribution: 15000,
      priority: 'medium',
      category: 'Travel',
    },
    {
      userId,
      name: 'New MacBook',
      targetAmount: 180000,
      currentAmount: 45000,
      targetDate: addMonths(new Date(), 8),
      monthlyContribution: 12000,
      priority: 'low',
      category: 'Shopping',
    },
  ]);

  await Investment.create([
    {
      userId,
      name: 'Parag Parikh Flexi Cap',
      type: 'mutual_fund',
      investedAmount: 250000,
      currentValue: 312500,
      units: 4125.55,
      purchaseDate: addMonths(new Date(), -24),
      notes: 'SIP since 2024',
    },
    {
      userId,
      name: 'Nifty BeES',
      type: 'etf',
      investedAmount: 120000,
      currentValue: 138400,
      units: 520,
      purchaseDate: addMonths(new Date(), -18),
    },
    {
      userId,
      name: 'SBI Tax Saving FD',
      type: 'fd',
      investedAmount: 100000,
      currentValue: 108200,
      purchaseDate: addMonths(new Date(), -12),
    },
    {
      userId,
      name: 'Digital Gold',
      type: 'gold',
      investedAmount: 45000,
      currentValue: 51200,
      units: 7.2,
      purchaseDate: addMonths(new Date(), -10),
    },
  ]);

  await RecurringExpense.create([
    {
      userId,
      merchant: 'Landlord Rent',
      categoryId: categoryByName.get('Rent'),
      frequency: 'monthly',
      averageAmount: 35000,
      nextExpectedDate: addMonths(startOfMonth(new Date()), 1),
      lastAmount: 35000,
      occurrenceCount: 3,
      isActive: true,
    },
    {
      userId,
      merchant: 'Netflix',
      categoryId: categoryByName.get('Subscriptions'),
      frequency: 'monthly',
      averageAmount: 649,
      nextExpectedDate: addMonths(startOfMonth(new Date()), 1),
      lastAmount: 649,
      occurrenceCount: 3,
      isActive: true,
    },
    {
      userId,
      merchant: 'HDFC Home Loan EMI',
      categoryId: categoryByName.get('EMI'),
      frequency: 'monthly',
      averageAmount: 18500,
      nextExpectedDate: addMonths(startOfMonth(new Date()), 1),
      lastAmount: 18500,
      occurrenceCount: 3,
      isActive: true,
    },
    {
      userId,
      merchant: 'Jio Fiber',
      categoryId: categoryByName.get('Utilities'),
      frequency: 'monthly',
      averageAmount: 2499,
      nextExpectedDate: addMonths(startOfMonth(new Date()), 1),
      lastAmount: 2499,
      occurrenceCount: 3,
      isActive: true,
    },
  ]);

  logger.info(
    {
      email: targetEmail,
      userId,
      name: user.name,
      password: isDemoTarget ? DEMO_PASSWORD : '(unchanged — use your login)',
      categories: CATEGORY_NAMES.length,
      transactions: txDocs.length,
    },
    'User-scoped seed completed'
  );

  await disconnectDatabase();
}

seed().catch(async (err: unknown) => {
  logger.error({ err }, 'Seed failed');
  try {
    await disconnectDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
