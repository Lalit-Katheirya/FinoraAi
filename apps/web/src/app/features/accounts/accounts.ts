import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceApiService } from '../../core/services/finance-api.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type AccountDto,
  type AccountType,
  type CurrencyCode,
} from '../../core/models';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';
import { FinoraCurrency } from '../../shared/components/finora-currency/finora-currency';
import { FinoraBadge } from '../../shared/components/finora-badge/finora-badge';
import { FinoraEmptyState } from '../../shared/components/finora-empty-state/finora-empty-state';
import { FinoraModal } from '../../shared/components/finora-modal/finora-modal';
import { FinoraSkeleton } from '../../shared/components/finora-skeleton/finora-skeleton';
import { FinoraAlert } from '../../shared/components/finora-alert/finora-alert';
import { extractErrorMessage } from '../../shared/utils/money';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FinoraCard,
    FinoraButton,
    FinoraCurrency,
    FinoraBadge,
    FinoraEmptyState,
    FinoraModal,
    FinoraSkeleton,
    FinoraAlert,
  ],
  templateUrl: './accounts.html',
})
export class AccountsPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly accounts = signal<AccountDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly modalOpen = signal(false);
  readonly editing = signal<AccountDto | null>(null);
  readonly saving = signal(false);
  readonly types = ACCOUNT_TYPES;
  readonly currencies = CURRENCIES;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: ['bank' as AccountType, Validators.required],
    institution: [''],
    accountNumberMasked: [''],
    currentBalance: [0, Validators.required],
    currency: ['INR' as CurrencyCode, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listAccounts().subscribe({
      next: (rows) => {
        this.accounts.set(rows);
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
      type: 'bank',
      institution: '',
      accountNumberMasked: '',
      currentBalance: 0,
      currency: 'INR',
    });
    this.modalOpen.set(true);
  }

  openEdit(account: AccountDto): void {
    this.editing.set(account);
    this.form.reset({
      name: account.name,
      type: account.type,
      institution: account.institution ?? '',
      accountNumberMasked: account.accountNumberMasked ?? '',
      currentBalance: account.currentBalance,
      currency: account.currency,
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
      ...raw,
      currentBalance: Number(raw.currentBalance),
      institution: raw.institution || undefined,
      accountNumberMasked: raw.accountNumberMasked || undefined,
    };
    this.saving.set(true);
    const req = this.editing()
      ? this.api.updateAccount(this.editing()!.id, body)
      : this.api.createAccount(body);
    req.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Account updated' : 'Account created');
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

  remove(account: AccountDto): void {
    if (!confirm(`Delete account "${account.name}"?`)) return;
    this.api.deleteAccount(account.id).subscribe({
      next: () => {
        this.toast.success('Account deleted');
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err)),
    });
  }
}
