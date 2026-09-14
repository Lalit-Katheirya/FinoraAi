import type { PaginationMeta } from '@finora/shared';

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

export function parsePagination(
  pageRaw: unknown,
  limitRaw: unknown,
  defaults: { page: number; limit: number; maxLimit?: number } = {
    page: 1,
    limit: 20,
    maxLimit: 100,
  }
): { page: number; limit: number; skip: number } {
  const maxLimit = defaults.maxLimit ?? 100;
  const page = Math.max(1, Number(pageRaw) || defaults.page);
  const limit = Math.min(maxLimit, Math.max(1, Number(limitRaw) || defaults.limit));
  return { page, limit, skip: (page - 1) * limit };
}
