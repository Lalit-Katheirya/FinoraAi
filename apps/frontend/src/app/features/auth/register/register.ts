import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FinoraAlert } from '../../../shared/components/finora-alert/finora-alert';
import { CURRENCIES, type CurrencyCode } from '../../../core/models';
import { extractErrorMessage } from '../../../shared/utils/money';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FinoraAlert],
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
    timezone: [
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      [Validators.required, Validators.minLength(1), Validators.maxLength(64)],
    ],
  });

  submit(): void {
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fix the highlighted fields and try again.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const value = this.form.getRawValue();
    this.auth.register(value).subscribe({
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

  fieldError(name: 'name' | 'email' | 'password' | 'timezone'): string {
    const c = this.form.controls[name];
    if (!c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Required';
    if (c.errors['email']) return 'Enter a valid email';
    if (c.errors['minlength']) {
      const need = c.errors['minlength'].requiredLength as number;
      return `Min ${need} characters`;
    }
    if (c.errors['maxlength']) return 'Too long';
    return 'Invalid';
  }
}
