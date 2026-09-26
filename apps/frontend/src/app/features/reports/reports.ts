import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FinanceApiService } from '../../core/services/finance-api.service';
import { ToastService } from '../../core/services/toast.service';
import type { ReportSummaryDto } from '../../core/models';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';
import { FinoraStatCard } from '../../shared/components/finora-stat-card/finora-stat-card';
import { FinoraCurrency } from '../../shared/components/finora-currency/finora-currency';
import { FinoraSkeleton } from '../../shared/components/finora-skeleton/finora-skeleton';
import { FinoraAlert } from '../../shared/components/finora-alert/finora-alert';
import { FinoraEmptyState } from '../../shared/components/finora-empty-state/finora-empty-state';
import { extractErrorMessage } from '../../shared/utils/money';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FinoraCard,
    FinoraButton,
    FinoraStatCard,
    FinoraCurrency,
    FinoraSkeleton,
    FinoraAlert,
    FinoraEmptyState,
  ],
  templateUrl: './reports.html',
})
export class ReportsPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly error = signal('');
  readonly report = signal<ReportSummaryDto | null>(null);

  readonly form = this.fb.nonNullable.group({
    period: ['monthly' as 'monthly' | 'quarterly' | 'annual'],
    year: [new Date().getFullYear()],
    month: [new Date().getMonth() + 1],
    quarter: [Math.floor(new Date().getMonth() / 3) + 1],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.api
      .getReport({
        period: v.period,
        year: v.year,
        month: v.period === 'monthly' ? v.month : undefined,
        quarter: v.period === 'quarterly' ? v.quarter : undefined,
      })
      .subscribe({
        next: (res) => {
          this.report.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractErrorMessage(err, 'Failed to load report'));
          this.loading.set(false);
        },
      });
  }

  exportCsv(): void {
    this.exporting.set(true);
    const v = this.form.getRawValue();
    this.api
      .exportReportCsv({
        period: v.period,
        year: v.year,
        month: v.period === 'monthly' ? v.month : undefined,
        quarter: v.period === 'quarterly' ? v.quarter : undefined,
      })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `finora-report-${v.period}-${v.year}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          this.toast.success('CSV downloaded');
          this.exporting.set(false);
        },
        error: (err) => {
          this.toast.error(extractErrorMessage(err, 'Export failed'));
          this.exporting.set(false);
        },
      });
  }
}
