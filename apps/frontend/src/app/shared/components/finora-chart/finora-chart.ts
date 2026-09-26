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
  @Input() height = '280px';

  private token(name: string, fallback: string): string {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
    );
  }

  get mergedOptions(): ChartConfiguration['options'] {
    const muted = this.token('--finora-text-muted', '#999999');
    const border = this.token('--finora-border', '#2e2e2e');
    const isCircular = ['doughnut', 'pie', 'polarArea'].includes(this.type);

    const base: ChartConfiguration['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: isCircular ? 'right' : 'top',
          labels: {
            color: muted,
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            padding: 16,
            font: { size: 12, family: "'DM Sans', system-ui, sans-serif" },
          },
        },
        tooltip: {
          backgroundColor: this.token('--finora-surface', '#161616'),
          titleColor: this.token('--finora-text', '#ffffff'),
          bodyColor: muted,
          borderColor: border,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
    };

    if (!isCircular) {
      base.scales = {
        x: {
          grid: { color: border },
          ticks: { color: muted, font: { size: 11 } },
          border: { display: false },
        },
        y: {
          grid: { color: border },
          ticks: { color: muted, font: { size: 11 } },
          border: { display: false },
          beginAtZero: true,
        },
      };
    }

    return {
      ...base,
      ...this.options,
      plugins: {
        ...base.plugins,
        ...(this.options?.plugins ?? {}),
        legend: {
          ...base.plugins?.legend,
          ...(this.options?.plugins?.legend ?? {}),
          labels: {
            ...(typeof base.plugins?.legend === 'object' ? base.plugins.legend.labels : {}),
            ...(typeof this.options?.plugins?.legend === 'object'
              ? this.options.plugins.legend.labels
              : {}),
          },
        },
      },
      scales: isCircular ? undefined : { ...base.scales, ...(this.options?.scales ?? {}) },
    };
  }
}
