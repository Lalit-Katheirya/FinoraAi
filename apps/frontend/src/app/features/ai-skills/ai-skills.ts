import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FinanceSkill {
  id: string;
  title: string;
  description: string;
  accent: string;
  icon: string;
  prompt: string;
}

@Component({
  selector: 'app-ai-skills-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ai-skills.html',
  styleUrl: './ai-skills.scss',
})
export class AiSkillsPage {
  readonly tab = signal<'all' | 'enabled' | 'mine'>('all');

  readonly skills: FinanceSkill[] = [
    {
      id: 'analyze',
      title: 'Analyze Like Me',
      description: 'Breaks down spending and cashflow the way you usually review your month.',
      accent: 'green',
      icon: '◎',
      prompt: 'Analyze my spending this month the way I usually review cashflow.',
    },
    {
      id: 'budget',
      title: 'Budget Like Me',
      description: 'Structures budgets and category limits the way you typically set them.',
      accent: 'orange',
      icon: '▣',
      prompt: 'Help me rebuild this month’s budget the way I normally plan categories.',
    },
    {
      id: 'forecast',
      title: 'Forecast Like Me',
      description: 'Projects balances and runway using your usual assumptions and buffers.',
      accent: 'yellow',
      icon: '↗',
      prompt: 'Forecast my next 3 months of cashflow with my usual safety buffer.',
    },
    {
      id: 'triage',
      title: 'Triage Expenses Like Me',
      description: 'Prioritizes and sorts incoming expenses the way you usually would.',
      accent: 'blue',
      icon: '⚡',
      prompt: 'Triage my recent expenses and flag what I should cut first.',
    },
    {
      id: 'save',
      title: 'Save Like Me',
      description: 'Builds savings moves in your voice — goals, transfers, and tradeoffs.',
      accent: 'purple',
      icon: '✦',
      prompt: 'Suggest savings moves that match how I usually fund my goals.',
    },
    {
      id: 'invest',
      title: 'Brief Like Me',
      description: 'Summarizes portfolio and market noise the way you prefer to be briefed.',
      accent: 'magenta',
      icon: '▦',
      prompt: 'Give me a short investment brief in the style I usually want.',
    },
  ];

  setTab(tab: 'all' | 'enabled' | 'mine'): void {
    this.tab.set(tab);
  }
}
