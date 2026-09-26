import type { AiStructuredResponse } from '@finora/shared';
import {
  runFinanceAgent,
  type FinanceAgentInput,
  type FinanceAgentOptions,
  type FinanceAgentResult,
} from '../agents/finance-agent';
import type { FinanceToolContext } from '../tools/types';
import type { UserPreferenceMemory } from '../memory/preferences';

export interface FinanceChatInput {
  message: string;
  conversationId?: string;
  preferences?: UserPreferenceMemory;
}

export interface FinanceChatResult {
  response: AiStructuredResponse;
  meta: {
    intent: FinanceAgentResult['intent'];
    permissionDenied: boolean;
    safetyFlags: string[];
    toolsUsed: string[];
  };
}

/**
 * Public workflow entrypoint used by apps/backend.
 */
export async function runFinanceChat(
  input: FinanceChatInput,
  context: FinanceToolContext,
  options: FinanceAgentOptions = {}
): Promise<FinanceChatResult> {
  const agentInput: FinanceAgentInput = {
    message: input.message,
    conversationId: input.conversationId,
    preferences: input.preferences,
  };

  const result = await runFinanceAgent(agentInput, context, options);

  return {
    response: result.response,
    meta: {
      intent: result.intent,
      permissionDenied: result.permissionDenied,
      safetyFlags: result.safetyFlags,
      toolsUsed: result.toolResults.map((t) => t.name),
    },
  };
}
