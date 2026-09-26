import type { Document } from 'mongoose';

function idOf(doc: { _id?: unknown; id?: unknown }): string {
  if (typeof doc.id === 'string') return doc.id;
  if (doc._id !== undefined && doc._id !== null) return String(doc._id);
  return '';
}

function userIdOf(doc: { userId?: unknown }): string {
  return doc.userId !== undefined && doc.userId !== null ? String(doc.userId) : '';
}

function dateOf(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date(0).toISOString();
}

export function toAccountDto(doc: Document & Record<string, unknown>) {
  return {
    id: idOf(doc),
    userId: userIdOf(doc),
    name: String(doc.name ?? ''),
    type: doc.type as string,
    institution: doc.institution as string | undefined,
    accountNumberMasked: doc.accountNumberMasked as string | undefined,
    currentBalance: Number(doc.currentBalance ?? 0),
    availableBalance: Number(doc.availableBalance ?? doc.currentBalance ?? 0),
    currency: (doc.currency as string) ?? 'INR',
    isActive: doc.isActive !== false,
    createdAt: dateOf(doc.createdAt),
    updatedAt: dateOf(doc.updatedAt),
  };
}

export function toTransactionDto(doc: Document & Record<string, unknown>) {
  return {
    id: idOf(doc),
    userId: userIdOf(doc),
    accountId: String(doc.accountId ?? ''),
    type: doc.type as string,
    amount: Number(doc.amount ?? 0),
    currency: (doc.currency as string) ?? 'INR',
    categoryId: doc.categoryId ? String(doc.categoryId) : undefined,
    categoryName: doc.categoryName as string | undefined,
    subCategory: doc.subCategory as string | undefined,
    merchant: doc.merchant as string | undefined,
    description: doc.description as string | undefined,
    transactionDate: dateOf(doc.transactionDate),
    paymentMethod: doc.paymentMethod as string | undefined,
    source: (doc.source as string) ?? 'manual',
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
    notes: doc.notes as string | undefined,
    confidenceScore:
      doc.confidenceScore !== undefined ? Number(doc.confidenceScore) : undefined,
    classificationSource: doc.classificationSource as string | undefined,
    isReviewed: Boolean(doc.isReviewed),
    createdAt: dateOf(doc.createdAt),
    updatedAt: dateOf(doc.updatedAt),
  };
}

export function toCategoryDto(doc: Document & Record<string, unknown>) {
  return {
    id: idOf(doc),
    name: String(doc.name ?? ''),
    icon: doc.icon as string | undefined,
    color: doc.color as string | undefined,
    isSystem: Boolean(doc.isSystem),
    parentId: doc.parentId ? String(doc.parentId) : undefined,
  };
}

export function toInsightDto(doc: Document & Record<string, unknown>) {
  return {
    id: idOf(doc),
    userId: userIdOf(doc),
    title: String(doc.title ?? ''),
    message: String(doc.message ?? ''),
    severity: doc.severity as string,
    category: doc.category as string | undefined,
    createdAt: dateOf(doc.createdAt),
    expiresAt: doc.expiresAt ? dateOf(doc.expiresAt) : undefined,
    isRead: Boolean(doc.isRead),
  };
}

export function toRecurringDto(doc: Document & Record<string, unknown>) {
  return {
    id: idOf(doc),
    userId: userIdOf(doc),
    merchant: String(doc.merchant ?? ''),
    categoryId: doc.categoryId ? String(doc.categoryId) : undefined,
    frequency: doc.frequency as string,
    averageAmount: Number(doc.averageAmount ?? 0),
    nextExpectedDate: dateOf(doc.nextExpectedDate),
    lastAmount: doc.lastAmount !== undefined ? Number(doc.lastAmount) : undefined,
    occurrenceCount: Number(doc.occurrenceCount ?? 0),
    isActive: doc.isActive !== false,
  };
}
