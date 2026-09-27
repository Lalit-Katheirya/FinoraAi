import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { guestMatch } from './core/guards/route-match';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [guestMatch],
    loadComponent: () => import('./features/landing/landing').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell-layout').then((m) => m.ShellLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/list/transactions-list').then((m) => m.TransactionsPage),
      },
      {
        path: 'transactions/import',
        loadComponent: () =>
          import('./features/transactions/import/import-page').then((m) => m.ImportPage),
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/accounts').then((m) => m.AccountsPage),
      },
      {
        path: 'budgets',
        loadComponent: () => import('./features/budgets/budgets').then((m) => m.BudgetsPage),
      },
      {
        path: 'goals',
        loadComponent: () => import('./features/goals/goals').then((m) => m.GoalsPage),
      },
      {
        path: 'investments',
        loadComponent: () =>
          import('./features/investments/investments').then((m) => m.InvestmentsPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.ReportsPage),
      },
      {
        path: 'ai',
        loadComponent: () =>
          import('./features/ai-assistant/ai-assistant').then((m) => m.AiAssistantPage),
      },
      {
        path: 'ai/skills',
        loadComponent: () => import('./features/ai-skills/ai-skills').then((m) => m.AiSkillsPage),
      },
      {
        path: 'ai/analytics',
        loadComponent: () =>
          import('./features/ai-analytics/ai-analytics').then((m) => m.AiAnalyticsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
