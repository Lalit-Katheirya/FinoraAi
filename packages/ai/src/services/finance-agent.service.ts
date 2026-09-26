import type { AiStructuredResponse } from '@finora/shared';
import { createLLMProvider, type LLMProvider, type LLMProviderConfig } from '../providers';
import {
  InMemoryPreferenceStore,
  type PreferenceStore,
  type UserPreferenceMemory,
} from '../memory/preferences';
import type { FinanceToolContext } from '../tools/types';
import {
  runFinanceChat,
  type FinanceChatInput,
  type FinanceChatResult,
} from '../workflows/chat.workflow';

export interface FinanceAgentServiceOptions {
  llm?: LLMProvider;
  llmConfig?: LLMProviderConfig;
  preferenceStore?: PreferenceStore;
}

/**
 * High-level API consumed by apps/backend controllers/services.
 * Wire a FinanceToolContext that calls your repositories — never pass DB clients here.
 */
export class FinanceAgentService {
  private readonly llm: LLMProvider;
  private readonly preferenceStore: PreferenceStore;

  constructor(options: FinanceAgentServiceOptions = {}) {
    this.llm =
      options.llm ??
      createLLMProvider(
        options.llmConfig ?? {
          provider: process.env.OPENAI_API_KEY ? 'openai' : 'mock',
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL,
        }
      );
    this.preferenceStore =
      options.preferenceStore ?? new InMemoryPreferenceStore();
  }

  getProviderName(): string {
    return this.llm.name;
  }

  async getPreferences(userId: string): Promise<UserPreferenceMemory | null> {
    return this.preferenceStore.get(userId);
  }

  async savePreferences(memory: UserPreferenceMemory): Promise<void> {
    await this.preferenceStore.save(memory);
  }

  async chat(
    input: FinanceChatInput,
    context: FinanceToolContext
  ): Promise<FinanceChatResult> {
    const preferences =
      input.preferences ??
      (await this.preferenceStore.get(context.userId)) ??
      undefined;

    return runFinanceChat(
      { ...input, preferences },
      context,
      { llm: this.llm }
    );
  }

  /** Convenience helper returning only the structured assistant payload. */
  async ask(
    message: string,
    context: FinanceToolContext
  ): Promise<AiStructuredResponse> {
    const result = await this.chat({ message }, context);
    return result.response;
  }
}
