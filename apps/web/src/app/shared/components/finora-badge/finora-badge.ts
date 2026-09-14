import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'finora-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
      [ngClass]="toneClass"
    >
      <ng-content />
    </span>
  `,
})
export class FinoraBadge {
  @Input() tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary' = 'neutral';

  get toneClass(): string {
    switch (this.tone) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
      case 'warning':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
      case 'danger':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300';
      case 'info':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300';
      case 'primary':
        return 'bg-[var(--finora-primary-muted)] text-[var(--finora-primary)]';
      default:
        return 'bg-[var(--finora-surface-2)] text-[var(--finora-text-muted)]';
    }
  }
}
