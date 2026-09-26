import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import type { ChartData, ChartType } from 'chart.js';
import { FinanceApiService } from '../../core/services/finance-api.service';
import type { DashboardSummaryDto, InsightSeverity } from '../../core/models';
import { FinoraStatCard } from '../../shared/components/finora-stat-card/finora-stat-card';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraChart } from '../../shared/components/finora-chart/finora-chart';
import { FinoraTransactionRow } from '../../shared/components/finora-transaction-row/finora-transaction-row';
import { FinoraBadge } from '../../shared/components/finora-badge/finora-badge';
import { FinoraSkeleton } from '../../shared/components/finora-skeleton/finora-skeleton';
import { FinoraAlert } from '../../shared/components/finora-alert/finora-alert';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';
import { FinoraEmptyState } from '../../shared/components/finora-empty-state/finora-empty-state';
import { extractErrorMessage } from '../../shared/utils/money';

export type ChartFormOption = { id: ChartType; label: string };

const FLOW_FORMS: ChartFormOption[] = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'radar', label: 'Radar' },
];

const CATEGORY_FORMS: ChartFormOption[] = [
  { id: 'doughnut', label: 'Donut' },
  { id: 'pie', label: 'Pie' },
  { id: 'polarArea', label: 'Polar' },
  { id: 'bar', label: 'Bar' },
];

const TREND_FORMS: ChartFormOption[] = [
  { id: 'line', label: 'Line' },
  { id: 'bar', label: 'Bar' },
  { id: 'doughnut', label: 'Donut' },
];

const CATEGORY_PALETTE = [
  '#00E599',
  '#3B82F6',
  '#A855F7',
  '#6B7280',
  '#33F0B0',
  '#60A5FA',
  '#C084FC',
  '#9CA3AF',
];

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    FinoraStatCard,
    FinoraCard,
    FinoraChart,
    FinoraTransactionRow,
    FinoraBadge,
    FinoraSkeleton,
    FinoraAlert,
    FinoraButton,
    FinoraEmptyState,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = signal<DashboardSummaryDto | null>(null);

  readonly flowForms = FLOW_FORMS;
  readonly categoryForms = CATEGORY_FORMS;
  readonly trendForms = TREND_FORMS;

  readonly flowChartType = signal<ChartType>('bar');
  readonly categoryChartType = signal<ChartType>('doughnut');
  readonly trendChartType = signal<ChartType>('line');

  readonly goTransactions = (): void => {
    void this.router.navigateByUrl('/transactions');
  };

  readonly savingsRate = computed(() => {
    const d = this.data();
    if (!d || d.monthlyIncome <= 0) return null;
    return Math.round((d.savings / d.monthlyIncome) * 1000) / 10;
  });

  readonly expenseRatio = computed(() => {
    const d = this.data();
    if (!d || d.monthlyIncome <= 0) return null;
    return Math.round((d.monthlyExpenses / d.monthlyIncome) * 1000) / 10;
  });

  readonly flowChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.incomeVsExpense ?? [];
    const type = this.flowChartType();
    const labels = rows.map((r) => r.label);
    const income = rows.map((r) => r.income);
    const expense = rows.map((r) => r.expense);

    if (type === 'line') {
      return {
        labels,
        datasets: [
          {
            label: 'Income',
            data: income,
            borderColor: '#00E599',
            backgroundColor: 'rgba(0,229,153,0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#00E599',
          },
          {
            label: 'Expense',
            data: expense,
            borderColor: '#9CA3AF',
            backgroundColor: 'rgba(156,163,175,0.1)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#9CA3AF',
          },
        ],
      };
    }

    if (type === 'radar') {
      return {
        labels,
        datasets: [
          {
            label: 'Income',
            data: income,
            borderColor: '#00E599',
            backgroundColor: 'rgba(0,229,153,0.2)',
            pointBackgroundColor: '#00E599',
          },
          {
            label: 'Expense',
            data: expense,
            borderColor: '#9CA3AF',
            backgroundColor: 'rgba(156,163,175,0.15)',
            pointBackgroundColor: '#9CA3AF',
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: income,
          backgroundColor: '#00E599',
          borderRadius: 8,
          maxBarThickness: 42,
        },
        {
          label: 'Expense',
          data: expense,
          backgroundColor: '#6B7280',
          borderRadius: 8,
          maxBarThickness: 42,
        },
      ],
    };
  });

  readonly categoryChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.categoryBreakdown ?? [];
    const type = this.categoryChartType();
    const labels = rows.map((r) => r.category);
    const amounts = rows.map((r) => r.amount);
    const colors = rows.map((_, i) => CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]);

    if (type === 'bar') {
      return {
        labels,
        datasets: [
          {
            label: 'Spend',
            data: amounts,
            backgroundColor: colors,
            borderRadius: 8,
            maxBarThickness: 36,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: colors,
          borderWidth: type === 'doughnut' || type === 'pie' ? 2 : 0,
          borderColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--finora-surface')
            .trim() || '#161616',
          hoverOffset: 6,
        },
      ],
    };
  });

  readonly trendChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.incomeVsExpense ?? [];
    const type = this.trendChartType();
    const labels = rows.map((r) => r.label);
    const net = rows.map((r) => r.income - r.expense);

    if (type === 'doughnut') {
      const positive = net.filter((n) => n >= 0).reduce((a, b) => a + b, 0);
      const negative = Math.abs(net.filter((n) => n < 0).reduce((a, b) => a + b, 0));
      return {
        labels: ['Positive months', 'Deficit months'],
        datasets: [
          {
            data: [positive, negative],
            backgroundColor: ['#00E599', '#6B7280'],
            borderWidth: 2,
            borderColor:
              getComputedStyle(document.documentElement)
                .getPropertyValue('--finora-surface')
                .trim() || '#161616',
          },
        ],
      };
    }

    if (type === 'bar') {
      return {
        labels,
        datasets: [
          {
            label: 'Net savings',
            data: net,
            backgroundColor: net.map((n) => (n >= 0 ? '#00E599' : '#6B7280')),
            borderRadius: 8,
            maxBarThickness: 40,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Net savings',
          data: net,
          borderColor: '#00E599',
          backgroundColor: 'rgba(0,229,153,0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#00E599',
        },
      ],
    };
  });

  ngOnInit(): void {
    this.load();
  }

  setFlowType(type: ChartType): void {
    this.flowChartType.set(type);
  }

  setCategoryType(type: ChartType): void {
    this.categoryChartType.set(type);
  }

  setTrendType(type: ChartType): void {
    this.trendChartType.set(type);
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Failed to load dashboard'));
        this.loading.set(false);
      },
    });
  }

  severityTone(severity: InsightSeverity): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        return 'neutral';
    }
  }
}
