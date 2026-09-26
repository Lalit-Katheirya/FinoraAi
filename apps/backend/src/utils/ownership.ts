import { AppError } from '../utils/AppError';

export function assertOwned(resourceUserId: string, authUserId: string): void {
  if (resourceUserId !== authUserId) {
    throw AppError.forbidden('You do not have access to this resource');
  }
}
