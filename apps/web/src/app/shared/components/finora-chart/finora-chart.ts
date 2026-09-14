import { Component, Input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'finora-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="relative w-full" [style.height]="height">
      <canvas
        baseChart
        [type]="type"
        [data]="data"
        [options]="mergedOptions"
      ></canvas>
    </div>
  `,
})
export class FinoraChart {
  @Input() type: ChartType = 'bar';
  @Input() data: ChartData = { labels: [], datasets: [] };
  @Input() options: ChartConfiguration['options'] = {};
  @Input() height = '260px';

  get mergedOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--finora-text-muted').trim() || '#64748b',
          },
        },
        ...(this.options?.plugins ?? {}),
      },
      scales: this.options?.scales,
      ...this.options,
    };
  }
}
