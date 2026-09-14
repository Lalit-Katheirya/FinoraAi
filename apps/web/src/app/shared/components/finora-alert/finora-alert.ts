import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'finora-alert',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="rounded-xl border px-4 py-3 text-sm"
      [ngClass]="toneClass"
      role="alert"
    >
      @if (title) {
        <div class="mb-1 font-semibold">{{ title }}</div>
      }
      <div><ng-content /></div>
    </div>
  `,
})
export class FinoraAlert {
  @Input() title = '';
  @Input() tone: 'info' | 'success' | 'warning' | 'danger' = 'info';

  get toneClass(): string {
    switch (this.tone) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200';
      case 'danger':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200';
      default:
        return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-200';
    }
  }
}
