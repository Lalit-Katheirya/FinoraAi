import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinanceApiService } from '../../core/services/finance-api.service';
import type { AiChatMessageDto, AiStructuredResponse } from '../../core/models';
import { FinoraCurrency } from '../../shared/components/finora-currency/finora-currency';
import { extractErrorMessage } from '../../shared/utils/money';

interface ChatBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structured?: AiStructuredResponse;
}

const WELCOME: ChatBubble = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi — I'm Finora Brain. Ask about spending, budgets, goals, or cashflow. Pick a skill, or tell me what you want to do next.",
};

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FinoraCurrency],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
})
export class AiAssistantPage {
  private readonly api = inject(FinanceApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('scrollBox') scrollBox?: ElementRef<HTMLDivElement>;
  @ViewChild('composerInput') composerInput?: ElementRef<HTMLTextAreaElement>;

  readonly loading = signal(false);
  readonly error = signal('');
  readonly conversationId = signal<string | undefined>(undefined);
  readonly messages = signal<ChatBubble[]>([{ ...WELCOME }]);
  readonly agentMode = signal('Finora');
  readonly skillsOpen = signal(false);

  readonly agentModes = ['Finora', 'Max', 'Analyst'];

  readonly prompts = [
    'Where am I overspending this month?',
    'How much should I save for my top goal?',
    'Summarize my income vs expenses',
    'Any unusual transactions I should review?',
  ];

  readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const prompt = params.get('prompt')?.trim();
      if (!prompt || this.loading()) return;
      this.form.patchValue({ message: prompt });
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
      this.send();
    });
  }

  newChat(): void {
    this.conversationId.set(undefined);
    this.messages.set([{ ...WELCOME, id: `welcome-${Date.now()}` }]);
    this.error.set('');
    this.form.reset({ message: '' });
    this.skillsOpen.set(false);
    queueMicrotask(() => this.composerInput?.nativeElement.focus());
  }

  toggleSkills(): void {
    this.skillsOpen.update((v) => !v);
  }

  cycleAgent(): void {
    const modes = this.agentModes;
    const idx = modes.indexOf(this.agentMode());
    this.agentMode.set(modes[(idx + 1) % modes.length]);
  }

  usePrompt(text: string): void {
    this.skillsOpen.set(false);
    this.form.patchValue({ message: text });
    this.send();
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
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
    this.skillsOpen.set(false);
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
