/** Shared domain types for Finora AI */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export type AccountType =
  | 'bank'
  | 'cash'
  | 'credit_card'
  | 'debit'
  | 'wallet'
  | 'investment';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type ClassificationSource = 'rule' | 'ai' | 'manual';

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

export type ImportSource = 'csv' | 'pdf' | 'manual' | 'api';

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

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

export type CategoryName = (typeof CATEGORY_NAMES)[number];

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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
