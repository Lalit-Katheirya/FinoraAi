import type {
  AccountType,
  ClassificationSource,
  CurrencyCode,
  GoalPriority,
  InsightSeverity,
  InvestmentType,
  PaymentMethod,
  TransactionType,
  BudgetPeriod,
  ImportSource,
} from './common';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  currency: CurrencyCode;
  timezone: string;
  monthlyIncome?: number;
  avatarUrl?: string;
  financialPreferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDto {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  institution?: string;
  accountNumberMasked?: string;
  currentBalance: number;
  availableBalance: number;
  currency: CurrencyCode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  parentId?: string;
}

export interface TransactionDto {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  categoryId?: string;
  categoryName?: string;
  subCategory?: string;
  merchant?: string;
  description?: string;
  transactionDate: string;
  paymentMethod?: PaymentMethod;
  source: ImportSource;
  tags: string[];
  notes?: string;
  confidenceScore?: number;
  classificationSource?: ClassificationSource;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDto {
  id: string;
  userId: string;
  name: string;
  period: BudgetPeriod;
  categoryId?: string;
  categoryName?: string;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  currency: CurrencyCode;
  startDate: string;
  endDate: string;
  alertThresholds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalDto {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  priority: GoalPriority;
  category: string;
  progressPercent: number;
  requiredMonthly: number;
  shortfall: number;
  suggestedMonthly: number;
  expectedCompletionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentDto {
  id: string;
  userId: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  units?: number;
  purchaseDate: string;
  notes?: string;
  profitLoss: number;
  returnPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpenseDto {
  id: string;
  userId: string;
  merchant: string;
  categoryId?: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  averageAmount: number;
  nextExpectedDate: string;
  lastAmount?: number;
  occurrenceCount: number;
  isActive: boolean;
}

export interface FinancialInsightDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  severity: InsightSeverity;
  category?: string;
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
}

export interface AiChatMessageDto {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structured?: AiStructuredResponse;
  createdAt: string;
}

export interface AiStructuredResponse {
  text: string;
  tables?: Array<{ title: string; headers: string[]; rows: string[][] }>;
  numbers?: Array<{ label: string; value: number; currency?: string }>;
  charts?: Array<{ type: string; title: string; data: unknown }>;
  warnings?: string[];
  recommendations?: string[];
  disclaimer?: string;
}

export interface DashboardSummaryDto {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  investments: number;
  upcomingBills: number;
  currency: CurrencyCode;
  insights: FinancialInsightDto[];
}
