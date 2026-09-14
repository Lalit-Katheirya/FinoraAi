import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AccountDto, TransactionDto } from '../../../core/models';
import { CATEGORY_NAMES } from '../../../core/models';
import { FinoraModal } from '../../../shared/components/finora-modal/finora-modal';
import { FinoraButton } from '../../../shared/components/finora-button/finora-button';
import { extractErrorMessage, toDateInputValue } from '../../../shared/utils/money';

@Component({
  selector: 'app-transaction-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FinoraModal, FinoraButton],
  templateUrl: './transaction-form.html',
})
export class TransactionFormModal implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);

  @Input() open = false;
  @Input() transaction: TransactionDto | null = null;
  @Input() accounts: AccountDto[] = [];
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<void>();

  readonly categories = CATEGORY_NAMES;
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    accountId: ['', Validators.required],
    type: ['expense' as 'income' | 'expense' | 'transfer', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    categoryName: [''],
    merchant: [''],
    description: [''],
    transactionDate: [toDateInputValue(new Date()), Validators.required],
    notes: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transaction'] || changes['open'] || changes['accounts']) {
      this.resetForm();
    }
  }

  resetForm(): void {
    const tx = this.transaction;
    if (tx) {
      this.form.reset({
        accountId: tx.accountId,
        type: tx.type,
        amount: tx.amount,
        categoryName: tx.categoryName ?? '',
        merchant: tx.merchant ?? '',
        description: tx.description ?? '',
        transactionDate: toDateInputValue(tx.transactionDate),
        notes: tx.notes ?? '',
      });
    } else {
      this.form.reset({
        accountId: this.accounts[0]?.id ?? '',
        type: 'expense',
        amount: 0,
        categoryName: '',
        merchant: '',
        description: '',
        transactionDate: toDateInputValue(new Date()),
        notes: '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      ...raw,
      amount: Number(raw.amount),
      categoryName: raw.categoryName || undefined,
      merchant: raw.merchant || undefined,
      description: raw.description || undefined,
      notes: raw.notes || undefined,
      transactionDate: new Date(raw.transactionDate).toISOString(),
    };

    this.saving.set(true);
    const req = this.transaction
      ? this.api.updateTransaction(this.transaction.id, body)
      : this.api.createTransaction(body);

    req.subscribe({
      next: () => {
        this.toast.success(this.transaction ? 'Transaction updated' : 'Transaction added');
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
