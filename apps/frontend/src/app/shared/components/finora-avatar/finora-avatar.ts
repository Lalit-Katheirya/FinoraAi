import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'finora-avatar',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--finora-border)] bg-[var(--finora-primary-muted)] font-semibold text-[var(--finora-primary)]"
      [ngClass]="sizeClass"
      [attr.title]="name || 'Profile'"
    >
      @if (src) {
        <img [src]="src" [alt]="name || 'Profile'" class="h-full w-full object-cover" />
      } @else {
        <span>{{ initials }}</span>
      }
    </div>
  `,
})
export class FinoraAvatar {
  @Input() name = '';
  @Input() src: string | null | undefined;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get initials(): string {
    const parts = (this.name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get sizeClass(): string {
    switch (this.size) {
      case 'sm':
        return 'h-8 w-8 text-xs';
      case 'lg':
        return 'h-14 w-14 text-lg';
      case 'xl':
        return 'h-20 w-20 text-2xl';
      default:
        return 'h-10 w-10 text-sm';
    }
  }
}
