import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FinoraButton } from '../finora-button/finora-button';

@Component({
  selector: 'finora-modal',
  standalone: true,
  imports: [FinoraButton],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        (click)="onBackdrop($event)"
      >
        <div
          class="finora-surface flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
          (click)="$event.stopPropagation()"
        >
          <header class="flex items-start justify-between gap-3 border-b border-[var(--finora-border)] px-5 py-4">
            <div>
              <h2 class="m-0 font-display text-lg font-semibold">{{ title }}</h2>
              @if (subtitle) {
                <p class="finora-muted m-0 mt-1 text-sm">{{ subtitle }}</p>
              }
            </div>
            <finora-button variant="ghost" size="sm" (clicked)="close.emit()">✕</finora-button>
          </header>
          <div class="overflow-y-auto px-5 py-4">
            <ng-content />
          </div>
          @if (showFooter) {
            <footer class="flex justify-end gap-2 border-t border-[var(--finora-border)] px-5 py-4">
              <ng-content select="[modal-footer]" />
            </footer>
          }
        </div>
      </div>
    }
  `,
})
export class FinoraModal {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showFooter = false;
  @Input() closeOnBackdrop = true;
  @Output() readonly close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
