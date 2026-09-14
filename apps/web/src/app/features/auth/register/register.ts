import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FinoraButton } from '../../../shared/components/finora-button/finora-button';
import { FinoraAlert } from '../../../shared/components/finora-alert/finora-alert';
import { CURRENCIES, type CurrencyCode } from '../../../core/models';
import { extractErrorMessage } from '../../../shared/utils/money';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FinoraButton, FinoraAlert],
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly currencies = CURRENCIES;
  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    currency: ['INR' as CurrencyCode, Validators.required],
    timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    console.log(this.form.getRawValue());
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Account created');
        void this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Registration failed'));
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
