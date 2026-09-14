import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import type {
  AccountDto,
  BudgetDto,
  DashboardSummaryDto,
  GoalDto,
  ImportBatchDto,
  ImportPreviewRow,
  InvestmentDto,
  PaginationMeta,
  ReportSummaryDto,
  TransactionDto,
  AiChatMessageDto,
  AiStructuredResponse,
} from '../../core/models';

@Injectable({ providedIn: 'root' })
export class FinanceApiService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<DashboardSummaryDto> {
    return this.api.get<DashboardSummaryDto>('/dashboard/summary');
  }

  listTransactions(
    params: Record<string, string | number | boolean | undefined | null> = {}
  ): Observable<{ data: TransactionDto[]; meta?: PaginationMeta }> {
    return this.api.getWithMeta<TransactionDto[]>('/transactions', params);
  }

  createTransaction(body: unknown): Observable<TransactionDto> {
    return this.api.post<TransactionDto>('/transactions', body);
  }

  updateTransaction(id: string, body: unknown): Observable<TransactionDto> {
    return this.api.patch<TransactionDto>(`/transactions/${id}`, body);
  }

  deleteTransaction(id: string): Observable<unknown> {
    return this.api.delete(`/transactions/${id}`);
  }

  listAccounts(): Observable<AccountDto[]> {
    return this.api.get<AccountDto[]>('/accounts');
  }

  createAccount(body: unknown): Observable<AccountDto> {
    return this.api.post<AccountDto>('/accounts', body);
  }

  updateAccount(id: string, body: unknown): Observable<AccountDto> {
    return this.api.patch<AccountDto>(`/accounts/${id}`, body);
  }

  deleteAccount(id: string): Observable<unknown> {
    return this.api.delete(`/accounts/${id}`);
  }

  listBudgets(): Observable<BudgetDto[]> {
    return this.api.get<BudgetDto[]>('/budgets');
  }

  createBudget(body: unknown): Observable<BudgetDto> {
    return this.api.post<BudgetDto>('/budgets', body);
  }

  updateBudget(id: string, body: unknown): Observable<BudgetDto> {
    return this.api.patch<BudgetDto>(`/budgets/${id}`, body);
  }

  deleteBudget(id: string): Observable<unknown> {
    return this.api.delete(`/budgets/${id}`);
  }

  listGoals(): Observable<GoalDto[]> {
    return this.api.get<GoalDto[]>('/goals');
  }

  createGoal(body: unknown): Observable<GoalDto> {
    return this.api.post<GoalDto>('/goals', body);
  }

  updateGoal(id: string, body: unknown): Observable<GoalDto> {
    return this.api.patch<GoalDto>(`/goals/${id}`, body);
  }

  deleteGoal(id: string): Observable<unknown> {
    return this.api.delete(`/goals/${id}`);
  }

  listInvestments(): Observable<InvestmentDto[]> {
    return this.api.get<InvestmentDto[]>('/investments');
  }

  createInvestment(body: unknown): Observable<InvestmentDto> {
    return this.api.post<InvestmentDto>('/investments', body);
  }

  updateInvestment(id: string, body: unknown): Observable<InvestmentDto> {
    return this.api.patch<InvestmentDto>(`/investments/${id}`, body);
  }

  deleteInvestment(id: string): Observable<unknown> {
    return this.api.delete(`/investments/${id}`);
  }

  getReport(params: Record<string, string | number | undefined>): Observable<ReportSummaryDto> {
    return this.api.get<ReportSummaryDto>('/reports/summary', params);
  }

  exportReportCsv(params: Record<string, string | number | undefined>): Observable<Blob> {
    return this.api.blob('/reports/summary', { ...params, format: 'csv' });
  }

  uploadCsv(file: File): Observable<ImportBatchDto> {
    const fd = new FormData();
    fd.append('file', file);
    return this.api.upload<ImportBatchDto>('/import/csv', fd);
  }

  uploadPdf(file: File): Observable<ImportBatchDto> {
    const fd = new FormData();
    fd.append('file', file);
    return this.api.upload<ImportBatchDto>('/import/pdf', fd);
  }

  mapImport(
    id: string,
    body: { columnMapping: Record<string, string>; accountId: string }
  ): Observable<ImportBatchDto> {
    return this.api.post<ImportBatchDto>(`/import/${id}/map`, body);
  }

  previewImport(id: string): Observable<ImportBatchDto | { rows: ImportPreviewRow[] }> {
    return this.api.get(`/import/${id}/preview`);
  }

  approveImport(id: string): Observable<unknown> {
    return this.api.post(`/import/${id}/approve`);
  }

  rejectImport(id: string): Observable<unknown> {
    return this.api.post(`/import/${id}/reject`);
  }

  aiChat(
    message: string,
    conversationId?: string
  ): Observable<{
    conversationId: string;
    message: AiChatMessageDto;
    structured?: AiStructuredResponse;
  }> {
    return this.api.post('/ai/chat', { message, conversationId });
  }
}
