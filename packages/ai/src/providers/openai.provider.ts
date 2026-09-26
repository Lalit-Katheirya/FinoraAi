import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { LLMChatOptions, LLMMessage, LLMProvider, LLMProviderConfig } from './types';
import { MockLLMProvider } from './mock.provider';

const DEFAULT_TIMEOUT_MS = 25_000;

export class OpenAILLMProvider implements LLMProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly defaultTemperature: number;
  private readonly baseURL?: string;
  private readonly fallback = new MockLLMProvider();

  constructor(config: LLMProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI provider requires an apiKey');
    }
    this.apiKey = config.apiKey;
    this.modelName = config.model ?? 'gpt-4o-mini';
    this.defaultTemperature = config.temperature ?? 0.2;
    this.baseURL = config.baseURL;
  }

  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<string> {
    const model = new ChatOpenAI({
      apiKey: this.apiKey,
      model: this.modelName,
      temperature: options?.temperature ?? this.defaultTemperature,
      timeout: DEFAULT_TIMEOUT_MS,
      maxRetries: 0,
      maxTokens: 900,
      configuration: this.baseURL ? { baseURL: this.baseURL } : undefined,
      modelKwargs:
        options?.responseFormat === 'json'
          ? { response_format: { type: 'json_object' } }
          : undefined,
    });

    const lcMessages: BaseMessage[] = messages.map((m) => {
      if (m.role === 'system') return new SystemMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });

    try {
      const response = await model.invoke(lcMessages);
      return contentToText(response.content);
    } catch (error) {
      if (isRecoverableLlmError(error)) {
        // Fast local fallback when billing/quota/network fails — avoids multi-minute hangs.
        return this.fallback.chat(messages, options);
      }
      throw error;
    }
  }
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (
          typeof part === 'object' &&
          part !== null &&
          'text' in part &&
          typeof (part as { text: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .join('');
  }
  return String(content);
}

export function isRecoverableLlmError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
      ? (error as { status: number }).status
      : undefined;

  if (status === 429 || status === 401 || status === 402 || status === 503) {
    return true;
  }

  return /429|rate limit|no credits|insufficient_quota|billing|timeout|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(
    message
  );
}
