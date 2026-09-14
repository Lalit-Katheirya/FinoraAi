import { createHash } from 'crypto';

export function buildDuplicateHash(
  date: string,
  amount: number,
  merchant: string,
  accountId: string
): string {
  return createHash('sha256')
    .update(`${date}|${amount}|${merchant}|${accountId}`)
    .digest('hex');
}
