import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'finora-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled || loading"
      (click)="clicked.emit($event)"
      class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
             disabled:cursor-not-allowed disabled:opacity-55"
      [ngClass]="[variantClass, sizeClass, className]"
      [style.outlineColor]="'var(--finora-primary)'"
    >
      @if (loading) {
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"></span>
      }
      <ng-content />
    </button>
  `,
})
export class FinoraButton {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() className = '';
  @Output() readonly clicked = new EventEmitter<MouseEvent>();

  get variantClass(): string {
    switch (this.variant) {
      case 'secondary':
        return 'bg-[var(--finora-surface-2)] text-[var(--finora-text)] border border-[var(--finora-border)] hover:border-[var(--finora-primary)]';
      case 'ghost':
        return 'bg-transparent text-[var(--finora-text-muted)] hover:bg-[var(--finora-surface-2)] hover:text-[var(--finora-text)]';
      case 'danger':
        return 'bg-[var(--finora-danger)] text-white hover:opacity-90';
      default:
        return 'bg-[var(--finora-primary)] text-[var(--finora-on-primary)] hover:bg-[var(--finora-primary-hover)] shadow-sm';
    }
  }

  get sizeClass(): string {
    switch (this.size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-5 py-3 text-base';
      default:
        return 'px-4 py-2.5 text-sm';
    }
  }
}
