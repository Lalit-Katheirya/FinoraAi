import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { FinanceApiService } from '../../core/services/finance-api.service';
import { ToastService } from '../../core/services/toast.service';
import type { GoalDto, GoalPriority } from '../../core/models';
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
  selector: 'app-goals-page',
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
  templateUrl: './goals.html',
})
export class GoalsPage implements OnInit {
  private readonly api = inject(FinanceApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly goals = signal<GoalDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly modalOpen = signal(false);
  readonly editing = signal<GoalDto | null>(null);
  readonly saving = signal(false);
  readonly simGoalId = signal<string | null>(null);
  readonly simMonthly = signal(0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    targetAmount: [0, [Validators.required, Validators.min(1)]],
    currentAmount: [0, [Validators.min(0)]],
    targetDate: [toDateInputValue(new Date(Date.now() + 365 * 86400000)), Validators.required],
    monthlyContribution: [0, [Validators.min(0)]],
    priority: ['medium' as GoalPriority],
    category: ['Savings', Validators.required],
  });

  readonly simForm = this.fb.nonNullable.group({
    monthlyContribution: [0, [Validators.min(0)]],
  });

  readonly simulation = computed(() => {
    const id = this.simGoalId();
    const goal = this.goals().find((g) => g.id === id);
    if (!goal) return null;
    const monthly = this.simMonthly();
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
    const months = monthly > 0 ? Math.ceil(remaining / monthly) : null;
    return { goal, monthly, remaining, months, required: goal.requiredMonthly };
  });

  constructor() {
    this.simForm.controls.monthlyContribution.valueChanges.subscribe((v) => {
      this.simMonthly.set(Number(v) || 0);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listGoals().subscribe({
      next: (rows) => {
        this.goals.set(rows);
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
      targetAmount: 0,
      currentAmount: 0,
      targetDate: toDateInputValue(new Date(Date.now() + 365 * 86400000)),
      monthlyContribution: 0,
      priority: 'medium',
      category: 'Savings',
    });
    this.modalOpen.set(true);
  }

  openEdit(goal: GoalDto): void {
    this.editing.set(goal);
    this.form.reset({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: toDateInputValue(goal.targetDate),
      monthlyContribution: goal.monthlyContribution,
      priority: goal.priority,
      category: goal.category,
    });
    this.modalOpen.set(true);
  }

  openSim(goal: GoalDto): void {
    this.simGoalId.set(goal.id);
    const monthly = goal.monthlyContribution || goal.requiredMonthly;
    this.simForm.reset({ monthlyContribution: monthly });
    this.simMonthly.set(monthly);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      ...raw,
      targetAmount: Number(raw.targetAmount),
      currentAmount: Number(raw.currentAmount),
      monthlyContribution: Number(raw.monthlyContribution),
      targetDate: new Date(raw.targetDate).toISOString(),
    };
    this.saving.set(true);
    const req = this.editing()
      ? this.api.updateGoal(this.editing()!.id, body)
      : this.api.createGoal(body);
    req.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Goal updated' : 'Goal created');
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

  remove(goal: GoalDto): void {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    this.api.deleteGoal(goal.id).subscribe({
      next: () => {
        this.toast.success('Goal deleted');
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err)),
    });
  }

  clamped(goal: GoalDto): number {
    return Math.min(goal.progressPercent, 100);
  }

  priorityTone(p: GoalPriority): 'neutral' | 'info' | 'warning' | 'danger' {
    if (p === 'high') return 'danger';
    if (p === 'medium') return 'warning';
    return 'info';
  }
}
