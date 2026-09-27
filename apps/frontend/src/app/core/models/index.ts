export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export type AccountType =
  | 'bank'
  | 'cash'
  | 'credit_card'
  | 'debit'
  | 'wallet'
  | 'investment';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type BudgetPeriod = 'monthly' | 'annual' | 'category';
export type GoalPriority = 'low' | 'medium' | 'high';
export type InvestmentType =
  | 'mutual_fund'
  | 'stock'
  | 'etf'
  | 'fd'
  | 'gold'
  | 'ppf'
  | 'other';
export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical';
export type PaymentMethod =
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'cash'
  | 'cheque'
  | 'other';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export type ApiResponse<T> = ApiSuccessBody<T> | ApiErrorBody;

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
  source: string;
  tags: string[];
  notes?: string;
  confidenceScore?: number;
  classificationSource?: string;
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

export interface AiStructuredResponse {
  text: string;
  tables?: Array<{ title: string; headers: string[]; rows: string[][] }>;
  numbers?: Array<{ label: string; value: number; currency?: string }>;
  charts?: Array<{ type: string; title: string; data: unknown }>;
  warnings?: string[];
  recommendations?: string[];
  disclaimer?: string;
}

export interface AiChatMessageDto {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structured?: AiStructuredResponse;
  createdAt: string;
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
  recentTransactions: TransactionDto[];
  chartData: {
    incomeVsExpense: Array<{ label: string; income: number; expense: number }>;
    categoryBreakdown: Array<{ category: string; amount: number }>;
  };
}

export interface ReportSummaryDto {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  byCategory: Array<{ category: string; amount: number }>;
  currency: CurrencyCode;
}

export interface ImportBatchDto {
  id: string;
  status: string;
  headers?: string[];
  columnMapping?: Record<string, string>;
  accountId?: string;
  previewRows?: ImportPreviewRow[];
  rowCount?: number;
  message?: string;
}

export interface ImportPreviewRow {
  id: string;
  date?: string;
  amount?: number;
  merchant?: string;
  description?: string;
  type?: TransactionType;
  categoryName?: string;
  status?: string;
  raw?: Record<string, string>;
}

export interface AuthPayload {
  user: UserDto;
  accessToken: string;
}

export const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export const ACCOUNT_TYPES: AccountType[] = [
  'bank',
  'cash',
  'credit_card',
  'debit',
  'wallet',
  'investment',
];

export const INVESTMENT_TYPES: InvestmentType[] = [
  'mutual_fund',
  'stock',
  'etf',
  'fd',
  'gold',
  'ppf',
  'other',
];

export const CATEGORY_NAMES = [
  'Food',
  'Groceries',
  'Rent',
  'Utilities',
  'Transport',
  'Fuel',
  'Shopping',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'Subscriptions',
  'Insurance',
  'EMI',
  'Investment',
  'Salary',
  'Freelance',
  'Business',
  'Transfer',
  'Other',
] as const;
