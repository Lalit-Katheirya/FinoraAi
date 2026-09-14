import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'finora-toast-host',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(360px,92vw)] flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur"
          [ngClass]="tone(toast.kind)"
          role="status"
        >
          <div class="flex items-start justify-between gap-3">
            <span>{{ toast.text }}</span>
            <button class="opacity-70 hover:opacity-100" type="button" (click)="toastService.dismiss(toast.id)">
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class FinoraToastHost {
  readonly toastService = inject(ToastService);

  tone(kind: string): string {
    switch (kind) {
      case 'success':
        return 'border-emerald-500/30 bg-[var(--finora-surface)] text-emerald-700 dark:text-emerald-300';
      case 'error':
        return 'border-rose-500/30 bg-[var(--finora-surface)] text-rose-700 dark:text-rose-300';
      case 'warning':
        return 'border-amber-500/30 bg-[var(--finora-surface)] text-amber-800 dark:text-amber-300';
      default:
        return 'border-[var(--finora-border)] bg-[var(--finora-surface)] text-[var(--finora-text)]';
    }
  }
}
