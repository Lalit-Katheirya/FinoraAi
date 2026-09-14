import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AccountDto, PaginationMeta, TransactionDto, TransactionType } from '../../../core/models';
import { CATEGORY_NAMES } from '../../../core/models';
import { FinoraButton } from '../../../shared/components/finora-button/finora-button';
import { FinoraCard } from '../../../shared/components/finora-card/finora-card';
import { FinoraBadge } from '../../../shared/components/finora-badge/finora-badge';
import { FinoraCurrency } from '../../../shared/components/finora-currency/finora-currency';
import { FinoraEmptyState } from '../../../shared/components/finora-empty-state/finora-empty-state';
import { FinoraSkeleton } from '../../../shared/components/finora-skeleton/finora-skeleton';
import { FinoraAlert } from '../../../shared/components/finora-alert/finora-alert';
import { TransactionFormModal } from '../form/transaction-form';
import { extractErrorMessage } from '../../../shared/utils/money';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    FinoraButton,
    FinoraCard,
    FinoraBadge,
    FinoraCurrency,
    FinoraEmptyState,
    FinoraSkeleton,
    FinoraAlert,
    TransactionFormModal,
  ],
  templateUrl: './transactions-list.html',
})
export class TransactionsPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly rows = signal<TransactionDto[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly accounts = signal<AccountDto[]>([]);
  readonly modalOpen = signal(false);
  readonly editing = signal<TransactionDto | null>(null);

  readonly categories = CATEGORY_NAMES;

  readonly filters = this.fb.nonNullable.group({
    q: [''],
    type: ['' as '' | TransactionType],
    accountId: [''],
    page: [1],
  });

  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        if (this.filters.controls.page.value !== 1 && this.filters.controls.q.dirty) {
          this.filters.patchValue({ page: 1 }, { emitEvent: false });
        }
        this.load();
      });
  }

  ngOnInit(): void {
    this.api.listAccounts().subscribe({
      next: (accounts) => this.accounts.set(accounts),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const v = this.filters.getRawValue();
    this.api
      .listTransactions({
        q: v.q || undefined,
        type: v.type || undefined,
        accountId: v.accountId || undefined,
        page: v.page,
        limit: 15,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (res) => {
          this.rows.set(res.data);
          this.meta.set(res.meta ?? null);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractErrorMessage(err, 'Failed to load transactions'));
          this.loading.set(false);
        },
      });
  }

  openCreate(): void {
    this.editing.set(null);
    this.modalOpen.set(true);
  }

  openEdit(tx: TransactionDto): void {
    this.editing.set(tx);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editing.set(null);
  }

  onSaved(): void {
    this.closeModal();
    this.load();
  }

  remove(tx: TransactionDto): void {
    if (!confirm(`Delete transaction "${tx.merchant || tx.description || tx.id}"?`)) return;
    this.api.deleteTransaction(tx.id).subscribe({
      next: () => {
        this.toast.success('Transaction deleted');
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err)),
    });
  }

  prevPage(): void {
    const page = this.filters.controls.page.value;
    if (page > 1) this.filters.patchValue({ page: page - 1 });
  }

  nextPage(): void {
    const meta = this.meta();
    const page = this.filters.controls.page.value;
    if (meta && page < meta.totalPages) this.filters.patchValue({ page: page + 1 });
  }
}
