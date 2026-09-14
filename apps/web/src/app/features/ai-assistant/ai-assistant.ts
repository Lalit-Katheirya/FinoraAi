import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FinanceApiService } from '../../core/services/finance-api.service';
import type { AiChatMessageDto, AiStructuredResponse } from '../../core/models';
import { FinoraButton } from '../../shared/components/finora-button/finora-button';
import { FinoraCard } from '../../shared/components/finora-card/finora-card';
import { FinoraAlert } from '../../shared/components/finora-alert/finora-alert';
import { FinoraCurrency } from '../../shared/components/finora-currency/finora-currency';
import { extractErrorMessage } from '../../shared/utils/money';

interface ChatBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structured?: AiStructuredResponse;
}

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, FinoraButton, FinoraCard, FinoraAlert, FinoraCurrency],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
})
export class AiAssistantPage {
  private readonly api = inject(FinanceApiService);
  private readonly fb = inject(FormBuilder);

  @ViewChild('scrollBox') scrollBox?: ElementRef<HTMLDivElement>;

  readonly loading = signal(false);
  readonly error = signal('');
  readonly conversationId = signal<string | undefined>(undefined);
  readonly messages = signal<ChatBubble[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi — I am Finora AI. Ask about spending, budgets, goals, or cashflow. I can show tables and recommendations when helpful.',
    },
  ]);

  readonly prompts = [
    'Where am I overspending this month?',
    'How much should I save for my top goal?',
    'Summarize my income vs expenses',
    'Any unusual transactions I should review?',
  ];

  readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(1)]],
  });

  usePrompt(text: string): void {
    this.form.patchValue({ message: text });
    this.send();
  }

  send(): void {
    if (this.form.invalid || this.loading()) return;
    const text = this.form.controls.message.value.trim();
    if (!text) return;

    this.messages.update((list) => [
      ...list,
      { id: `u-${Date.now()}`, role: 'user', content: text },
    ]);
    this.form.reset({ message: '' });
    this.loading.set(true);
    this.error.set('');
    this.scrollToBottom();

    this.api.aiChat(text, this.conversationId()).subscribe({
      next: (res) => {
        if (res.conversationId) this.conversationId.set(res.conversationId);
        const msg: AiChatMessageDto = res.message;
        const structured = res.structured ?? msg.structured;
        this.messages.update((list) => [
          ...list,
          {
            id: msg.id || `a-${Date.now()}`,
            role: 'assistant',
            content: structured?.text || msg.content,
            structured,
          },
        ]);
        this.loading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'AI request failed'));
        this.loading.set(false);
      },
    });
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      const el = this.scrollBox?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
