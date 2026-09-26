import { Component, Input } from '@angular/core';
import { FinoraCurrency } from '../finora-currency/finora-currency';
import type { CurrencyCode } from '../../../core/models';

@Component({
  selector: 'finora-stat-card',
  standalone: true,
  imports: [FinoraCurrency],
  template: `
    <article class="finora-surface flex flex-col gap-3 p-4">
      <div class="flex items-start justify-between gap-2">
        <p class="finora-muted m-0 text-xs font-medium uppercase tracking-wide">{{ label }}</p>
        @if (icon) {
          <span class="text-lg opacity-70">{{ icon }}</span>
        }
      </div>
      <finora-currency [amount]="value" [currency]="currency" className="font-display text-2xl font-bold tabular-nums" />
      @if (hint) {
        <p class="finora-muted m-0 text-xs">{{ hint }}</p>
      }
    </article>
  `,
})
export class FinoraStatCard {
  @Input() label = '';
  @Input() value = 0;
  @Input() currency: CurrencyCode | string = 'INR';
  @Input() hint = '';
  @Input() icon = '';
}
