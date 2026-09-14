import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import type { LLMChatOptions, LLMMessage, LLMProvider, LLMProviderConfig } from './types';

export class OpenAILLMProvider implements LLMProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly modelName: string;
  private readonly defaultTemperature: number;
  private readonly baseURL?: string;

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
      configuration: this.baseURL ? { baseURL: this.baseURL } : undefined,
    });

    const lcMessages: BaseMessage[] = messages.map((m) => {
      if (m.role === 'system') return new SystemMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });

    const response = await model.invoke(lcMessages);

    const content = response.content;
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
}
