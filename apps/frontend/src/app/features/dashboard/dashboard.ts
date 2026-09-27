import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ChartData, ChartType } from 'chart.js';
import { FinanceApiService } from '../../core/services/finance-api.service';
import { AuthService } from '../../core/auth/auth.service';
import type { DashboardSummaryDto, InsightSeverity } from '../../core/models';
import { FinoraChart } from '../../shared/components/finora-chart/finora-chart';
import { FinoraTransactionRow } from '../../shared/components/finora-transaction-row/finora-transaction-row';
import { FinoraBadge } from '../../shared/components/finora-badge/finora-badge';
import { FinoraSkeleton } from '../../shared/components/finora-skeleton/finora-skeleton';
import { FinoraCurrency } from '../../shared/components/finora-currency/finora-currency';
import { extractErrorMessage } from '../../shared/utils/money';

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
    ReactiveFormsModule,
    FinoraChart,
    FinoraTransactionRow,
    FinoraBadge,
    FinoraSkeleton,
    FinoraCurrency,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.user;
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });
  readonly displayName = computed(() => this.user()?.name?.split(/\s+/)[0] || 'there');

  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = signal<DashboardSummaryDto | null>(null);
  readonly flowChartType = signal<ChartType>('bar');
  readonly categoryChartType = signal<ChartType>('doughnut');

  readonly askForm = this.fb.nonNullable.group({
    prompt: ['', [Validators.required, Validators.minLength(2)]],
  });

  readonly aiActions = [
    {
      title: 'Analyze spending',
      desc: 'Find leaks and category spikes this month',
      prompt: 'Where am I overspending this month?',
      icon: '◎',
      tone: 'green',
    },
    {
      title: 'Trim my budget',
      desc: 'Suggest cuts without hurting essentials',
      prompt: 'Help me rebuild this month’s budget and show where I can cut.',
      icon: '▣',
      tone: 'blue',
    },
    {
      title: 'Forecast runway',
      desc: 'Project cashflow for the next 90 days',
      prompt: 'Forecast my next 3 months of cashflow with a safety buffer.',
      icon: '↗',
      tone: 'purple',
    },
    {
      title: 'Goal check-in',
      desc: 'See if savings pace hits your targets',
      prompt: 'How much should I save for my top goal based on current pace?',
      icon: '✦',
      tone: 'orange',
    },
  ] as const;

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

  readonly healthLabel = computed(() => {
    const rate = this.savingsRate();
    if (rate === null) return 'Getting started';
    if (rate >= 20) return 'Healthy runway';
    if (rate >= 10) return 'Stable — room to improve';
    return 'Needs attention';
  });

  readonly healthTone = computed(() => {
    const rate = this.savingsRate();
    if (rate === null) return 'neutral' as const;
    if (rate >= 20) return 'success' as const;
    if (rate >= 10) return 'warning' as const;
    return 'danger' as const;
  });

  readonly topInsight = computed(() => this.data()?.insights?.[0] ?? null);

  readonly flowChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.incomeVsExpense ?? [];
    return {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Income',
          data: rows.map((r) => r.income),
          backgroundColor: '#00E599',
          borderRadius: 8,
          maxBarThickness: 36,
        },
        {
          label: 'Expense',
          data: rows.map((r) => r.expense),
          backgroundColor: '#6B7280',
          borderRadius: 8,
          maxBarThickness: 36,
        },
      ],
    };
  });

  readonly categoryChart = computed<ChartData>(() => {
    const rows = this.data()?.chartData.categoryBreakdown ?? [];
    return {
      labels: rows.map((r) => r.category),
      datasets: [
        {
          data: rows.map((r) => r.amount),
          backgroundColor: rows.map((_, i) => CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]),
          borderWidth: 2,
          borderColor:
            getComputedStyle(document.documentElement).getPropertyValue('--finora-surface').trim() ||
            '#161616',
          hoverOffset: 6,
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

  askFinora(prompt?: string): void {
    const text = (prompt ?? this.askForm.controls.prompt.value).trim();
    if (!text) return;
    void this.router.navigate(['/ai'], { queryParams: { prompt: text } });
  }

  submitAsk(): void {
    if (this.askForm.invalid) return;
    this.askFinora();
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
