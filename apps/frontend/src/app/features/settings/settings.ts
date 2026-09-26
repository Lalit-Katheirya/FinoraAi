import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { CURRENCIES, type CurrencyCode } from '../../core/models';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';
import { FinoraAlert } from '../../shared/components/finora-alert/finora-alert';
import { extractErrorMessage } from '../../shared/utils/money';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule, FinoraCard, FinoraButton, FinoraAlert],
  templateUrl: './settings.html',
})
export class SettingsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.user;
  readonly isDark = this.theme.isDark;
  readonly currencies = CURRENCIES;
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly deleting = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    currency: ['INR' as CurrencyCode, Validators.required],
    timezone: ['Asia/Kolkata', Validators.required],
    monthlyIncome: [0 as number | null],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.profileForm.patchValue({
        name: u.name,
        currency: u.currency,
        timezone: u.timezone,
        monthlyIncome: u.monthlyIncome ?? null,
      });
    } else {
      this.auth.me().subscribe({
        next: (user) =>
          this.profileForm.patchValue({
            name: user.name,
            currency: user.currency,
            timezone: user.timezone,
            monthlyIncome: user.monthlyIncome ?? null,
          }),
      });
    }
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const raw = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    // Backend profile PATCH may not exist yet — update local session + toast.
    this.auth.updateLocalUser({
      name: raw.name,
      currency: raw.currency,
      timezone: raw.timezone,
      monthlyIncome: raw.monthlyIncome == null ? undefined : Number(raw.monthlyIncome),
    });
    this.toast.success('Profile preferences saved locally. Sync endpoint pending on API.');
    this.savingProfile.set(false);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.toast.success('Password changed. Please sign in again.');
        this.savingPassword.set(false);
        void this.auth.logout().subscribe();
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err));
        this.savingPassword.set(false);
      },
    });
  }

  deleteAccount(): void {
    if (!confirm('Permanently delete your Finora account and data? This cannot be undone.')) return;
    this.deleting.set(true);
    this.auth.deleteAccount().subscribe({
      next: () => {
        this.toast.info('Account deleted');
        this.deleting.set(false);
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err));
        this.deleting.set(false);
      },
    });
  }
}
