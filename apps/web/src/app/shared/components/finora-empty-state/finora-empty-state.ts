import { Component, Input } from '@angular/core';
import { FinoraButton } from '../finora-button/finora-button';

@Component({
  selector: 'finora-empty-state',
  standalone: true,
  imports: [FinoraButton],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div
        class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--finora-primary-muted)] text-2xl text-[var(--finora-primary)]"
      >
        {{ icon }}
      </div>
      <h3 class="m-0 font-display text-lg font-semibold">{{ title }}</h3>
      @if (description) {
        <p class="finora-muted m-0 max-w-md text-sm">{{ description }}</p>
      }
      @if (actionLabel) {
        <finora-button className="mt-2" (clicked)="action?.()">{{ actionLabel }}</finora-button>
      }
    </div>
  `,
})
export class FinoraEmptyState {
  @Input() title = 'Nothing here yet';
  @Input() description = '';
  @Input() icon = '◇';
  @Input() actionLabel = '';
  @Input() action?: () => void;
}
