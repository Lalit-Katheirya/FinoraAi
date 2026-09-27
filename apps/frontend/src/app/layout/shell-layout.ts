import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { FinoraAvatar } from '../shared/components/finora-avatar/finora-avatar';

export type ShellSection = 'home' | 'money' | 'chat' | 'planner' | 'ai' | 'portfolio' | 'reports' | 'settings';

interface RailItem {
  id: ShellSection;
  label: string;
  path: string;
  match: (url: string) => boolean;
}

interface SideLink {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  exact?: boolean;
}

interface ChatPerson {
  id: string;
  name: string;
  path: string;
  avatarTone: 'green' | 'purple' | 'blue' | 'orange' | 'pink';
  initials: string;
  online?: boolean;
  badge?: string;
  subtitle?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  path: string;
  badge?: string;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FinoraAvatar],
  templateUrl: './shell-layout.html',
  styleUrl: './shell-layout.scss',
})
export class ShellLayout {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly mobileOpen = signal(false);
  readonly sideCollapsed = signal(false);
  readonly profileMenuOpen = signal(false);
  readonly currentUrl = signal(this.router.url.split('?')[0]);
  readonly user = this.auth.user;
  readonly isDark = this.theme.isDark;

  readonly rail: RailItem[] = [
    { id: 'home', label: 'Home', path: '/', match: (u) => u === '/' },
    {
      id: 'money',
      label: 'Money',
      path: '/transactions',
      match: (u) => u.startsWith('/transactions') || u.startsWith('/accounts'),
    },
    { id: 'chat', label: 'Chat', path: '/ai', match: (u) => u === '/ai' },
    {
      id: 'planner',
      label: 'Planner',
      path: '/budgets',
      match: (u) => u.startsWith('/budgets') || u.startsWith('/goals'),
    },
    {
      id: 'ai',
      label: 'AI',
      path: '/ai/skills',
      match: (u) => u.startsWith('/ai/') || u === '/ai',
    },
    {
      id: 'portfolio',
      label: 'Invest',
      path: '/investments',
      match: (u) => u.startsWith('/investments'),
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      match: (u) => u.startsWith('/reports'),
    },
    {
      id: 'settings',
      label: 'More',
      path: '/settings',
      match: (u) => u.startsWith('/settings'),
    },
  ];

  readonly activeSection = computed<ShellSection>(() => {
    const url = this.currentUrl();
    // Prefer more specific AI sub-routes as "ai" hub; bare /ai as chat
    if (url.startsWith('/ai/')) return 'ai';
    if (url === '/ai') return 'chat';
    const hit = this.rail.find((r) => r.id !== 'ai' && r.id !== 'chat' && r.match(url));
    return hit?.id ?? 'home';
  });

  readonly sideTitle = computed(() => {
    switch (this.activeSection()) {
      case 'money':
        return 'Money';
      case 'chat':
        return 'Chat';
      case 'planner':
        return 'Planner';
      case 'ai':
        return 'AI';
      case 'portfolio':
        return 'Invest';
      case 'reports':
        return 'Reports';
      case 'settings':
        return 'Workspace';
      default:
        return 'Home';
    }
  });

  readonly sideLinks = computed<SideLink[]>(() => {
    switch (this.activeSection()) {
      case 'money':
        return [
          { label: 'Transactions', path: '/transactions', icon: '⇄', exact: true },
          { label: 'Import', path: '/transactions/import', icon: '⇩' },
          { label: 'Accounts', path: '/accounts', icon: '🏦' },
        ];
      case 'chat':
        return [];
      case 'planner':
        return [
          { label: 'Budgets', path: '/budgets', icon: '▣' },
          { label: 'Goals', path: '/goals', icon: '◎' },
        ];
      case 'ai':
        return [
          { label: 'Ask or Create', path: '/ai', icon: '✦', exact: true },
          { label: 'Skills', path: '/ai/skills', icon: '⚡', badge: 'Beta' },
          { label: 'Analytics', path: '/ai/analytics', icon: '↗' },
          { label: 'Connections', path: '/settings', icon: '⬡' },
        ];
      case 'portfolio':
        return [{ label: 'Portfolio', path: '/investments', icon: '↗' }];
      case 'reports':
        return [{ label: 'Reports', path: '/reports', icon: '▦' }];
      case 'settings':
        return [
          { label: 'Settings', path: '/settings', icon: '⚙' },
          { label: 'Dashboard', path: '/', icon: '◈', exact: true },
        ];
      default:
        return [
          { label: 'AI Home', path: '/', icon: '◈', exact: true },
          { label: 'Ask Finora', path: '/ai', icon: '✦' },
          { label: 'Skills', path: '/ai/skills', icon: '⚡', badge: 'Beta' },
          { label: 'Transactions', path: '/transactions', icon: '⇄' },
          { label: 'Budgets', path: '/budgets', icon: '▣' },
          { label: 'Goals', path: '/goals', icon: '◎' },
        ];
    }
  });

  readonly agentLinks: SideLink[] = [
    { label: 'Create Agent', path: '/ai/skills', icon: '+' },
    { label: 'Agent Activity', path: '/ai/analytics', icon: '◷' },
    { label: 'All Agents', path: '/ai/skills', icon: '◎', badge: '1' },
    { label: 'My Agents', path: '/ai/skills', icon: '◉', badge: '1' },
  ];

  readonly recentChats = [
    { label: 'Cashflow check', path: '/ai' },
    { label: 'Budget trim ideas', path: '/ai' },
    { label: 'Goal savings plan', path: '/ai' },
  ];

  /** ClickUp-style Chat panel (finance agents / channels / DMs) */
  readonly chatSuperAgents: ChatPerson[] = [
    {
      id: 'cashflow',
      name: 'Finora Cashflow Coach',
      path: '/ai',
      avatarTone: 'pink',
      initials: 'FC',
      online: true,
      badge: '1',
    },
    {
      id: 'budget',
      name: 'Budget Triage Agent',
      path: '/ai',
      avatarTone: 'orange',
      initials: 'BT',
      online: true,
    },
  ];

  readonly chatChannels = computed<ChatChannel[]>(() => {
    const ws = this.workspaceName();
    return [
      { id: 'general', name: `# General — ${ws}`, path: '/ai' },
      { id: 'budgets', name: '# Budgets', path: '/budgets' },
      { id: 'goals', name: '# Goals', path: '/goals' },
    ];
  });

  readonly chatDirectMessages = computed<ChatPerson[]>(() => {
    const name = this.user()?.name?.trim() || 'You';
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'Y';
    return [
      {
        id: 'you',
        name: `${name} — You`,
        path: '/ai',
        avatarTone: 'purple',
        initials,
        online: true,
      },
    ];
  });

  readonly workspaceName = computed(() => {
    const name = this.user()?.name?.trim();
    if (!name) return 'Finora Workspace';
    const first = name.split(/\s+/)[0];
    return `${first}'s Workspace`;
  });

  readonly workspaceInitial = computed(() => {
    const name = this.user()?.name?.trim();
    return (name?.[0] ?? 'F').toUpperCase();
  });

  readonly chatUnread = computed(() =>
    this.chatSuperAgents.some((a) => !!a.badge) ? '1' : undefined
  );

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/ai/skills')) return 'Skills';
    if (url.startsWith('/ai/analytics')) return 'Analytics';
    if (url === '/ai') return 'Chat';
    if (url === '/') return 'AI Home';
    const labels: Record<string, string> = {
      '/transactions': 'Transactions',
      '/transactions/import': 'Import',
      '/accounts': 'Accounts',
      '/budgets': 'Budgets',
      '/goals': 'Goals',
      '/investments': 'Investments',
      '/reports': 'Reports',
      '/settings': 'Settings',
    };
    return labels[url] ?? 'Finora AI';
  });

  readonly showAiWorkChrome = computed(() => this.currentUrl().startsWith('/ai/'));
  readonly isChatPage = computed(() => this.currentUrl() === '/ai');

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects.split('?')[0]);
        this.mobileOpen.set(false);
        this.profileMenuOpen.set(false);
      });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.profileMenuOpen()) this.profileMenuOpen.set(false);
  }

  isRailActive(item: RailItem): boolean {
    const url = this.currentUrl();
    if (item.id === 'ai') return url.startsWith('/ai/');
    if (item.id === 'chat') return url === '/ai';
    return item.match(url);
  }

  toggleSide(): void {
    this.sideCollapsed.update((v) => !v);
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.clearHoverTimer();
    this.profileMenuOpen.update((open) => !open);
  }

  openProfileMenu(event?: Event): void {
    event?.stopPropagation();
    this.clearHoverTimer();
    this.profileMenuOpen.set(true);
  }

  scheduleCloseProfileMenu(): void {
    this.clearHoverTimer();
    this.hoverCloseTimer = setTimeout(() => this.profileMenuOpen.set(false), 180);
  }

  keepProfileMenuOpen(event: Event): void {
    event.stopPropagation();
    this.clearHoverTimer();
    this.profileMenuOpen.set(true);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.profileMenuOpen.set(false);
    this.auth.logout().subscribe();
  }

  private clearHoverTimer(): void {
    if (this.hoverCloseTimer) {
      clearTimeout(this.hoverCloseTimer);
      this.hoverCloseTimer = null;
    }
  }
}
