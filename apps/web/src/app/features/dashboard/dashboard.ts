import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ChartData } from 'chart.js';
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

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
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

  readonly goTransactions = (): void => {
    void this.router.navigateByUrl('/transactions');
  };

  readonly incomeExpenseChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.incomeVsExpense ?? [];
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Income',
          data: rows.map((r) => r.income),
          backgroundColor: '#0F766E',
          borderRadius: 8,
        },
        {
          label: 'Expense',
          data: rows.map((r) => r.expense),
          backgroundColor: '#94A3B8',
          borderRadius: 8,
        },
      ],
    };
  });

  readonly categoryChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.categoryBreakdown ?? [];
    const palette = ['#0F766E', '#0E7490', '#64748B', '#14B8A6', '#0369A1', '#475569', '#0D9488', '#334155'];
    return {
      labels: rows.map((r) => r.category),
      datasets: [
        {
          data: rows.map((r) => r.amount),
          backgroundColor: rows.map((_, i) => palette[i % palette.length]),
          borderWidth: 0,
        },
      ],
    };
  });

  readonly trendChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.incomeVsExpense ?? [];
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Net savings',
          data: rows.map((r) => r.income - r.expense),
          borderColor: '#0F766E',
          backgroundColor: 'rgba(15,118,110,0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.load();
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
