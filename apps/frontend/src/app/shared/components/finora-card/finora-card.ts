import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'finora-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <section class="finora-surface p-5" [ngClass]="className">
      @if (title || subtitle) {
        <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            @if (title) {
              <h3 class="m-0 text-base font-semibold font-display">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="finora-muted m-0 mt-1 text-sm">{{ subtitle }}</p>
            }
          </div>
          <div class="shrink-0">
            <ng-content select="[cardActions]" />
          </div>
        </header>
      }
      <ng-content />
    </section>
  `,
})
export class FinoraCard {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() className = '';
}
