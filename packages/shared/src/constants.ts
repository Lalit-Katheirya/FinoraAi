/** Merchant → category deterministic rules (uppercase keys) */
export const MERCHANT_CATEGORY_RULES: Record<string, string> = {
  SWIGGY: 'Food',
  ZOMATO: 'Food',
  DOMINOS: 'Food',
  MCDONALDS: 'Food',
  UBER: 'Transport',
  OLA: 'Transport',
  RAPIDO: 'Transport',
  IRCTC: 'Travel',
  NETFLIX: 'Subscriptions',
  SPOTIFY: 'Subscriptions',
  PRIME: 'Subscriptions',
  HOTSTAR: 'Subscriptions',
  YOUTUBE: 'Subscriptions',
  AMAZON: 'Shopping',
  FLIPKART: 'Shopping',
  MYNTRA: 'Shopping',
  AJIO: 'Shopping',
  BIGBASKET: 'Groceries',
  BLINKIT: 'Groceries',
  ZEPTO: 'Groceries',
  JIO: 'Utilities',
  AIRTEL: 'Utilities',
  BESCOM: 'Utilities',
  ACT: 'Utilities',
  HDFC: 'EMI',
  BAJAJ: 'EMI',
  LIC: 'Insurance',
  POLICYBAZAAR: 'Insurance',
  SALARY: 'Salary',
  PAYROLL: 'Salary',
};

export const BUDGET_ALERT_THRESHOLDS = [50, 75, 90, 100] as const;

export const JWT_ACCESS_EXPIRES = '15m';
export const JWT_REFRESH_EXPIRES = '7d';
