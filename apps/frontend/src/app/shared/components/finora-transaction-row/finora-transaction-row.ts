import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FinoraBadge } from '../finora-badge/finora-badge';
import { FinoraCurrency } from '../finora-currency/finora-currency';
import type { TransactionDto } from '../../../core/models';

@Component({
  selector: 'finora-transaction-row',
  standalone: true,
  imports: [DatePipe, FinoraBadge, FinoraCurrency],
  template: `
    <div class="flex items-center gap-3 py-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--finora-surface-2)] text-sm font-semibold"
      >
        {{ initials }}
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate font-medium">{{ tx.merchant || tx.description || 'Transaction' }}</div>
        <div class="finora-muted flex flex-wrap items-center gap-2 text-xs">
          <span>{{ tx.transactionDate | date: 'mediumDate' }}</span>
          @if (tx.categoryName) {
            <finora-badge>{{ tx.categoryName }}</finora-badge>
          }
        </div>
      </div>
      <finora-currency
        [amount]="displayAmount"
        [currency]="tx.currency"
        [tone]="tx.type === 'income' ? 'positive' : tx.type === 'expense' ? 'negative' : 'neutral'"
        className="font-semibold tabular-nums"
      />
    </div>
  `,
})
export class FinoraTransactionRow {
  @Input({ required: true }) tx!: TransactionDto;

  get initials(): string {
    const label = this.tx.merchant || this.tx.categoryName || this.tx.type;
    return label.slice(0, 2).toUpperCase();
  }

  get displayAmount(): number {
    return this.tx.type === 'expense' ? -Math.abs(this.tx.amount) : Math.abs(this.tx.amount);
  }
}
