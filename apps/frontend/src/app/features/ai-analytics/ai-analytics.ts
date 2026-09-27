import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';

@Component({
  selector: 'app-ai-analytics-page',
  standalone: true,
  imports: [RouterLink, FinoraCard, FinoraButton],
  template: `
    <div class="finora-page">
      <div class="finora-page-header">
        <div>
          <h2 class="finora-page-title">AI Analytics</h2>
          <p class="finora-page-subtitle">
            Usage and outcomes for Finora Brain — chats, skills, and finance agents.
          </p>
        </div>
        <a routerLink="/ai"><finora-button>Open AI Chat</finora-button></a>
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <finora-card title="Chats this week">
          <p class="m-0 font-display text-3xl font-bold tabular-nums">—</p>
          <p class="finora-muted mt-2 mb-0 text-sm">Connect usage tracking to populate.</p>
        </finora-card>
        <finora-card title="Skills enabled">
          <p class="m-0 font-display text-3xl font-bold tabular-nums">0</p>
          <p class="finora-muted mt-2 mb-0 text-sm">Create a skill from the Skills hub.</p>
        </finora-card>
        <finora-card title="Insights surfaced">
          <p class="m-0 font-display text-3xl font-bold tabular-nums">—</p>
          <p class="finora-muted mt-2 mb-0 text-sm">Shown on Home as your data grows.</p>
        </finora-card>
      </div>
    </div>
  `,
})
export class AiAnalyticsPage {}
