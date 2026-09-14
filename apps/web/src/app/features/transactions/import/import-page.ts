import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AccountDto, ImportBatchDto, ImportPreviewRow } from '../../../core/models';
import { FinoraCard } from '../../../shared/components/finora-card/finora-card';
import { FinoraButton } from '../../../shared/components/finora-button/finora-button';
import { FinoraAlert } from '../../../shared/components/finora-alert/finora-alert';
import { FinoraBadge } from '../../../shared/components/finora-badge/finora-badge';
import { extractErrorMessage } from '../../../shared/utils/money';

const TARGET_FIELDS = ['date', 'amount', 'merchant', 'description', 'type', 'categoryName'] as const;

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FinoraCard, FinoraButton, FinoraAlert, FinoraBadge],
  templateUrl: './import-page.html',
})
export class ImportPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly step = signal<'upload' | 'map' | 'preview' | 'done'>('upload');
  readonly loading = signal(false);
  readonly accounts = signal<AccountDto[]>([]);
  readonly batch = signal<ImportBatchDto | null>(null);
  readonly previewRows = signal<ImportPreviewRow[]>([]);
  readonly headers = signal<string[]>([]);
  readonly error = signal('');
  readonly targetFields = TARGET_FIELDS;

  readonly mapForm = this.fb.nonNullable.group({
    accountId: ['', Validators.required],
    date: [''],
    amount: ['', Validators.required],
    merchant: [''],
    description: [''],
    type: [''],
    categoryName: [''],
  });

  ngOnInit(): void {
    this.api.listAccounts().subscribe({
      next: (a) => {
        this.accounts.set(a);
        if (a[0]) this.mapForm.patchValue({ accountId: a[0].id });
      },
    });
  }

  onCsvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file, 'csv');
  }

  onPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file, 'pdf');
  }

  private upload(file: File, kind: 'csv' | 'pdf'): void {
    this.loading.set(true);
    this.error.set('');
    const req = kind === 'csv' ? this.api.uploadCsv(file) : this.api.uploadPdf(file);
    req.subscribe({
      next: (batch) => {
        this.batch.set(batch);
        const hdrs = batch.headers ?? Object.keys(batch.previewRows?.[0]?.raw ?? {});
        this.headers.set(hdrs);
        this.autoMap(hdrs);
        if (kind === 'pdf') {
          this.toast.info('PDF uploaded. Review extracted rows when available.');
          this.step.set('preview');
          this.loadPreview(batch.id);
        } else {
          this.step.set('map');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Upload failed'));
        this.loading.set(false);
      },
    });
  }

  private autoMap(headers: string[]): void {
    const lower = headers.map((h) => h.toLowerCase());
    const find = (...keys: string[]): string => {
      const idx = lower.findIndex((h) => keys.some((k) => h.includes(k)));
      return idx >= 0 ? headers[idx] : '';
    };
    this.mapForm.patchValue({
      date: find('date', 'posted', 'txn'),
      amount: find('amount', 'amt', 'value'),
      merchant: find('merchant', 'payee', 'narration'),
      description: find('description', 'details', 'memo'),
      type: find('type', 'credit', 'debit'),
      categoryName: find('category'),
    });
  }

  applyMapping(): void {
    const batch = this.batch();
    if (!batch || this.mapForm.invalid) {
      this.mapForm.markAllAsTouched();
      return;
    }
    const v = this.mapForm.getRawValue();
    const columnMapping: Record<string, string> = {};
    for (const field of TARGET_FIELDS) {
      const header = v[field];
      if (header) columnMapping[field] = header;
    }
    this.loading.set(true);
    this.api.mapImport(batch.id, { columnMapping, accountId: v.accountId }).subscribe({
      next: (updated) => {
        this.batch.set(updated);
        this.step.set('preview');
        this.loadPreview(batch.id);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  loadPreview(id: string): void {
    this.api.previewImport(id).subscribe({
      next: (res) => {
        const withRows = res as { rows?: ImportPreviewRow[] };
        const rows = Array.isArray(withRows.rows)
          ? withRows.rows
          : ((res as ImportBatchDto).previewRows ?? []);
        this.previewRows.set(rows);
      },
      error: (err) => this.toast.error(extractErrorMessage(err, 'Preview failed')),
    });
  }

  confirm(): void {
    const batch = this.batch();
    if (!batch) return;
    this.loading.set(true);
    this.api.approveImport(batch.id).subscribe({
      next: () => {
        this.toast.success('Import approved');
        this.step.set('done');
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  reject(): void {
    const batch = this.batch();
    if (!batch) return;
    this.api.rejectImport(batch.id).subscribe({
      next: () => {
        this.toast.info('Import rejected');
        this.step.set('upload');
        this.batch.set(null);
        this.previewRows.set([]);
      },
      error: (err) => this.toast.error(extractErrorMessage(err)),
    });
  }

  backToUpload(): void {
    this.step.set('upload');
  }
}
