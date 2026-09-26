import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { FinanceApiService } from '../../core/services/finance-api.service';
import { ToastService } from '../../core/services/toast.service';
import {
  INVESTMENT_TYPES,
  type InvestmentDto,
  type InvestmentType,
} from '../../core/models';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';
import { FinoraCurrency } from '../../shared/components/finora-currency/finora-currency';
import { FinoraBadge } from '../../shared/components/finora-badge/finora-badge';
import { FinoraEmptyState } from '../../shared/components/finora-empty-state/finora-empty-state';
import { FinoraModal } from '../../shared/components/finora-modal/finora-modal';
import { FinoraSkeleton } from '../../shared/components/finora-skeleton/finora-skeleton';
import { FinoraStatCard } from '../../shared/components/finora-stat-card/finora-stat-card';
import { FinoraAlert } from '../../shared/components/finora-alert/finora-alert';
import { extractErrorMessage, toDateInputValue } from '../../shared/utils/money';

@Component({
  selector: 'app-investments-page',
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
    FinoraStatCard,
    FinoraAlert,
  ],
  templateUrl: './investments.html',
})
export class InvestmentsPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<InvestmentDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly modalOpen = signal(false);
  readonly editing = signal<InvestmentDto | null>(null);
  readonly saving = signal(false);
  readonly types = INVESTMENT_TYPES;

  readonly summary = computed(() => {
    const rows = this.items();
    const invested = rows.reduce((s, r) => s + r.investedAmount, 0);
    const current = rows.reduce((s, r) => s + r.currentValue, 0);
    const pl = current - invested;
    const pct = invested > 0 ? (pl / invested) * 100 : 0;
    return { invested, current, pl, pct };
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: ['mutual_fund' as InvestmentType, Validators.required],
    investedAmount: [0, [Validators.required, Validators.min(0.01)]],
    currentValue: [0, [Validators.required, Validators.min(0)]],
    units: [0 as number | null],
    purchaseDate: [toDateInputValue(new Date()), Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listInvestments().subscribe({
      next: (rows) => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '',
      type: 'mutual_fund',
      investedAmount: 0,
      currentValue: 0,
      units: null,
      purchaseDate: toDateInputValue(new Date()),
      notes: '',
    });
    this.modalOpen.set(true);
  }

  openEdit(item: InvestmentDto): void {
    this.editing.set(item);
    this.form.reset({
      name: item.name,
      type: item.type,
      investedAmount: item.investedAmount,
      currentValue: item.currentValue,
      units: item.units ?? null,
      purchaseDate: toDateInputValue(item.purchaseDate),
      notes: item.notes ?? '',
    });
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      name: raw.name,
      type: raw.type,
      investedAmount: Number(raw.investedAmount),
      currentValue: Number(raw.currentValue),
      units: raw.units ? Number(raw.units) : undefined,
      purchaseDate: new Date(raw.purchaseDate).toISOString(),
      notes: raw.notes || undefined,
    };
    this.saving.set(true);
    const req = this.editing()
      ? this.api.updateInvestment(this.editing()!.id, body)
      : this.api.createInvestment(body);
    req.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Investment updated' : 'Investment added');
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

  remove(item: InvestmentDto): void {
    if (!confirm(`Delete investment "${item.name}"?`)) return;
    this.api.deleteInvestment(item.id).subscribe({
      next: () => {
        this.toast.success('Investment deleted');
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err)),
    });
  }
}
