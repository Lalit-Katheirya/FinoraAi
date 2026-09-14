import type { AiStructuredResponse } from '@finora/shared';

export type LLMRole = 'system' | 'user' | 'assistant';

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMChatOptions {
  temperature?: number;
  /** Prefer JSON object output when the provider supports it. */
  responseFormat?: 'text' | 'json';
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<string>;
}

export type LLMProviderKind = 'openai' | 'mock';

export interface LLMProviderConfig {
  provider?: LLMProviderKind;
  apiKey?: string;
  model?: string;
  temperature?: number;
  baseURL?: string;
}

export interface StructuredLLMPayload extends AiStructuredResponse {
  insufficientData?: boolean;
}
