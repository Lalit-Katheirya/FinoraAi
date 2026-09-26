import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceApiService } from '../../core/services/finance-api.service';
import { ToastService } from '../../core/services/toast.service';
import type { BudgetDto, BudgetPeriod, CurrencyCode } from '../../core/models';
import { CURRENCIES, CATEGORY_NAMES } from '../../core/models';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';
import { FinoraCurrency } from '../../shared/components/finora-currency/finora-currency';
import { FinoraBadge } from '../../shared/components/finora-badge/finora-badge';
import { FinoraEmptyState } from '../../shared/components/finora-empty-state/finora-empty-state';
import { FinoraModal } from '../../shared/components/finora-modal/finora-modal';
import { FinoraSkeleton } from '../../shared/components/finora-skeleton/finora-skeleton';
import { FinoraAlert } from '../../shared/components/finora-alert/finora-alert';
import { extractErrorMessage, toDateInputValue } from '../../shared/utils/money';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    FinoraCard,
    FinoraButton,
    FinoraCurrency,
    FinoraBadge,
    FinoraEmptyState,
    FinoraModal,
    FinoraSkeleton,
    FinoraAlert,
  ],
  templateUrl: './budgets.html',
})
export class BudgetsPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly budgets = signal<BudgetDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly modalOpen = signal(false);
  readonly editing = signal<BudgetDto | null>(null);
  readonly saving = signal(false);
  readonly currencies = CURRENCIES;
  readonly categories = CATEGORY_NAMES;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    period: ['monthly' as BudgetPeriod, Validators.required],
    categoryName: [''],
    amount: [0, [Validators.required, Validators.min(1)]],
    currency: ['INR' as CurrencyCode],
    startDate: [toDateInputValue(new Date()), Validators.required],
    endDate: [toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)), Validators.required],
    alertThresholds: ['50,80,100'],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listBudgets().subscribe({
      next: (rows) => {
        this.budgets.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  progressClass(budget: BudgetDto): string {
    const maxAlert = Math.max(...(budget.alertThresholds?.length ? budget.alertThresholds : [80, 100]));
    if (budget.percentUsed >= 100 || budget.percentUsed >= maxAlert) return 'danger';
    if (budget.percentUsed >= 80) return 'warn';
    return '';
  }

  clampedPercent(budget: BudgetDto): number {
    return Math.min(budget.percentUsed, 100);
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '',
      period: 'monthly',
      categoryName: '',
      amount: 0,
      currency: 'INR',
      startDate: toDateInputValue(new Date()),
      endDate: toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
      alertThresholds: '50,80,100',
    });
    this.modalOpen.set(true);
  }

  openEdit(budget: BudgetDto): void {
    this.editing.set(budget);
    this.form.reset({
      name: budget.name,
      period: budget.period,
      categoryName: budget.categoryName ?? '',
      amount: budget.amount,
      currency: budget.currency,
      startDate: toDateInputValue(budget.startDate),
      endDate: toDateInputValue(budget.endDate),
      alertThresholds: (budget.alertThresholds ?? []).join(','),
    });
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const alertThresholds = raw.alertThresholds
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    const body = {
      name: raw.name,
      period: raw.period,
      categoryName: raw.categoryName || undefined,
      amount: Number(raw.amount),
      currency: raw.currency,
      startDate: new Date(raw.startDate).toISOString(),
      endDate: new Date(raw.endDate).toISOString(),
      alertThresholds,
    };
    this.saving.set(true);
    const req = this.editing()
      ? this.api.updateBudget(this.editing()!.id, body)
      : this.api.createBudget(body);
    req.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Budget updated' : 'Budget created');
        this.modalOpen.set(false);
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err));
        this.saving.set(false);
      },
    });
  }

  remove(budget: BudgetDto): void {
    if (!confirm(`Delete budget "${budget.name}"?`)) return;
    this.api.deleteBudget(budget.id).subscribe({
      next: () => {
        this.toast.success('Budget deleted');
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err)),
    });
  }
}
