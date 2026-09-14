import { Pipe, PipeTransform } from '@angular/core';
import { formatMoney } from '../utils/money';
import type { CurrencyCode } from '../../core/models';

@Pipe({ name: 'finoraCurrency', standalone: true })
export class FinoraCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency: CurrencyCode | string = 'INR'): string {
    return formatMoney(value ?? 0, currency);
  }
}
