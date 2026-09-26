import type { LLMProvider, LLMProviderConfig } from './types';
import { MockLLMProvider } from './mock.provider';
import { OpenAILLMProvider } from './openai.provider';

export type { LLMProvider, LLMProviderConfig, LLMMessage, LLMChatOptions, LLMRole, LLMProviderKind, StructuredLLMPayload } from './types';
export { MockLLMProvider, isGreetingMessage } from './mock.provider';
export { OpenAILLMProvider, isRecoverableLlmError } from './openai.provider';

/**
 * Factory: uses Mock when provider=mock or when no API key is available.
 */
export function createLLMProvider(config: LLMProviderConfig = {}): LLMProvider {
  const kind = config.provider ?? (config.apiKey ? 'openai' : 'mock');

  if (kind === 'mock' || !config.apiKey) {
    return new MockLLMProvider();
  }

  if (kind === 'openai') {
    return new OpenAILLMProvider(config);
  }

  return new MockLLMProvider();
}
