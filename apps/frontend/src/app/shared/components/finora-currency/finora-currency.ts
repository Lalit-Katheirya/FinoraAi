import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FinoraCurrencyPipe } from '../../pipes/currency.pipe';
import type { CurrencyCode } from '../../../core/models';

@Component({
  selector: 'finora-currency',
  standalone: true,
  imports: [FinoraCurrencyPipe, NgClass],
  template: `
    <span [ngClass]="toneClass">
      {{ amount | finoraCurrency: currency }}
    </span>
  `,
})
export class FinoraCurrency {
  @Input({ required: true }) amount!: number;
  @Input() currency: CurrencyCode | string = 'INR';
  @Input() tone: 'neutral' | 'positive' | 'negative' = 'neutral';
  @Input() className = '';

  get toneClass(): string {
    const base = this.className;
    if (this.tone === 'positive') return `${base} text-[var(--finora-success)]`;
    if (this.tone === 'negative') return `${base} text-[var(--finora-danger)]`;
    return base;
  }
}
