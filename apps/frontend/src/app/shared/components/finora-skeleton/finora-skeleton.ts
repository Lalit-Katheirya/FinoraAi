import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'finora-skeleton',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div class="finora-skeleton" [ngStyle]="{ width, height, borderRadius: radius }"></div>
  `,
})
export class FinoraSkeleton {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() radius = '10px';
}
