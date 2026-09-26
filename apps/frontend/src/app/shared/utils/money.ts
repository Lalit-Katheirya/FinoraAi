import type { CurrencyCode } from '../../core/models';

const SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
};

export function formatMoney(amount: number, currency: CurrencyCode | string = 'INR'): string {
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (!err || typeof err !== 'object') return fallback;
  const httpErr = err as {
    error?: {
      error?: { message?: string; details?: Array<{ path?: string; message?: string }> };
      message?: string;
    };
    message?: string;
  };

  const details = httpErr.error?.error?.details;
  if (Array.isArray(details) && details.length) {
    return details
      .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
      .filter(Boolean)
      .join('; ');
  }

  return (
    httpErr.error?.error?.message ||
    httpErr.error?.message ||
    httpErr.message ||
    fallback
  );
}
