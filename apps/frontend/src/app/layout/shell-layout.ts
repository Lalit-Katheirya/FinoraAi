import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { FinoraButton } from '../shared/components/finora-button/finora-button';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FinoraButton],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);
  readonly user = this.auth.user;
  readonly isDark = this.theme.isDark;

  readonly nav: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: '◈' },
    { label: 'Transactions', path: '/transactions', icon: '⇄' },
    { label: 'Accounts', path: '/accounts', icon: '🏦' },
    { label: 'Budgets', path: '/budgets', icon: '▣' },
    { label: 'Goals', path: '/goals', icon: '◎' },
    { label: 'Investments', path: '/investments', icon: '↗' },
    { label: 'Reports', path: '/reports', icon: '▦' },
    { label: 'AI Assistant', path: '/ai', icon: '✦' },
    { label: 'Settings', path: '/settings', icon: '⚙' },
  ];

  readonly pageTitle = computed(() => {
    const url = this.router.url.split('?')[0];
    const match = this.nav.find((n) => (n.path === '/' ? url === '/' : url.startsWith(n.path)));
    return match?.label ?? 'Finora AI';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.mobileOpen.set(false));
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
