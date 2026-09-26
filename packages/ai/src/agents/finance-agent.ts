import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type { AiStructuredResponse } from '@finora/shared';
import type { LLMProvider } from '../providers/types';
import { createLLMProvider } from '../providers';
import { isGreetingMessage } from '../providers/mock.provider';
import { buildSystemPrompt } from '../prompts/system';
import { buildFinancePrompt, isKnowledgeIntent } from '../prompts/finance';
import {
  detectIntentHeuristic,
  type FinanceIntent,
  type IntentDetectionResult,
} from '../schemas/intent.schema';
import {
  AI_INSUFFICIENT_DATA_MESSAGE,
  FINANCIAL_INFO_DISCLAIMER,
  insufficientDataResponse,
  parseStructuredResponse,
  withDefaultDisclaimer,
  type AiStructuredResponseParsed,
} from '../schemas/response.schema';
import {
  allToolsEmpty,
  collectAuthoritativeNumbers,
  executeToolCalls,
  selectToolsForIntent,
  type FinanceToolContext,
  type ToolCallRequest,
  type ToolCallResult,
} from '../tools';
import type { UserPreferenceMemory } from '../memory/preferences';

export interface FinanceAgentInput {
  message: string;
  conversationId?: string;
  preferences?: UserPreferenceMemory;
}

export interface FinanceAgentResult {
  response: AiStructuredResponse;
  intent: FinanceIntent;
  toolResults: ToolCallResult[];
  permissionDenied: boolean;
  safetyFlags: string[];
}

const FinanceAgentState = Annotation.Root({
  message: Annotation<string>,
  preferences: Annotation<UserPreferenceMemory | undefined>,
  intentResult: Annotation<IntentDetectionResult | undefined>,
  permissionDenied: Annotation<boolean>,
  selectedTools: Annotation<ToolCallRequest[]>,
  toolResults: Annotation<ToolCallResult[]>,
  authoritativeNumbers: Annotation<
    Array<{ label: string; value: number; currency?: string }>
  >,
  safetyFlags: Annotation<string[]>,
  rawLlmText: Annotation<string | undefined>,
  structured: Annotation<AiStructuredResponseParsed | undefined>,
});

type AgentState = typeof FinanceAgentState.State;

export interface FinanceAgentOptions {
  llm?: LLMProvider;
}

export function createFinanceAgentGraph(
  context: FinanceToolContext,
  options: FinanceAgentOptions = {}
) {
  const llm = options.llm ?? createLLMProvider({ provider: 'mock' });

  const intentDetection = async (state: AgentState): Promise<Partial<AgentState>> => {
    const intentResult = detectIntentHeuristic(state.message);
    return { intentResult };
  };

  const permissionCheck = async (state: AgentState): Promise<Partial<AgentState>> => {
    const intent = state.intentResult;
    const denied =
      !!intent &&
      (intent.intent === 'action_request' || intent.requestedAction !== 'none');
    const safetyFlags = denied
      ? ['blocked_executable_action']
      : ([] as string[]);
    return { permissionDenied: denied, safetyFlags };
  };

  const toolSelection = async (state: AgentState): Promise<Partial<AgentState>> => {
    if (state.permissionDenied || !state.intentResult) {
      return { selectedTools: [] };
    }
    if (isGreetingMessage(state.message)) {
      return { selectedTools: [] };
    }
    const selectedTools = selectToolsForIntent(
      state.intentResult.intent,
      { ...state.intentResult.entities, message: state.message }
    );
    return { selectedTools };
  };

  const dataRetrieval = async (state: AgentState): Promise<Partial<AgentState>> => {
    if (state.permissionDenied || state.selectedTools.length === 0) {
      return { toolResults: [] };
    }
    const toolResults = await executeToolCalls(context, state.selectedTools);
    return { toolResults };
  };

  const financialCalculation = async (
    state: AgentState
  ): Promise<Partial<AgentState>> => {
    const authoritativeNumbers = collectAuthoritativeNumbers(state.toolResults);
    return { authoritativeNumbers };
  };

  const riskSafetyCheck = async (state: AgentState): Promise<Partial<AgentState>> => {
    const flags = [...state.safetyFlags];
    const intent = state.intentResult?.intent ?? 'general_question';

    // Knowledge intents (tax/market/CA education) may proceed without personal tool data.
    if (
      !state.permissionDenied &&
      allToolsEmpty(state.toolResults) &&
      !isKnowledgeIntent(intent)
    ) {
      flags.push('insufficient_tool_data');
      return {
        safetyFlags: flags,
        structured: insufficientDataResponse(),
      };
    }

    // Ensure we never claim execution capability
    if (state.permissionDenied) {
      flags.push('execution_refused');
    }

    return { safetyFlags: flags };
  };

  const llmResponse = async (state: AgentState): Promise<Partial<AgentState>> => {
    if (state.structured?.insufficientData) {
      return {};
    }

    // Instant path — no OpenAI round-trip for greetings
    if (isGreetingMessage(state.message)) {
      return {
        rawLlmText: JSON.stringify({
          text: "Hi — I'm Finora AI, your personal CA-style finance manager. Ask about spending, budgets, goals, India tax (80C, ITR, LTCG), stock-market basics, or your Finora accounts.",
          recommendations: [
            'Try: “Explain 80C deductions”',
            'Try: “What is my budget status?”',
            'Try: “How does SIP work?”',
          ],
          disclaimer: FINANCIAL_INFO_DISCLAIMER,
        }),
      };
    }

    const intent = state.intentResult?.intent ?? 'general_question';
    const toolPayload = {
      results: state.toolResults,
      authoritativeNumbers: state.authoritativeNumbers,
    };

    const userPrompt = buildFinancePrompt({
      intent,
      userMessage: state.message,
      toolResultsJson: JSON.stringify(toolPayload, null, 2),
      preferences: state.preferences,
      permissionDenied: state.permissionDenied,
    });

    const rawLlmText = await llm.chat(
      [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userPrompt },
      ],
      { responseFormat: 'json', temperature: 0.2 }
    );

    return { rawLlmText };
  };

  const structuredResponse = async (
    state: AgentState
  ): Promise<Partial<AgentState>> => {
    if (state.structured?.insufficientData) {
      return {
        structured: withDefaultDisclaimer(state.structured),
      };
    }

    const parsed = state.rawLlmText
      ? parseStructuredResponse(stripMarkdownFence(state.rawLlmText))
      : null;

    if (!parsed) {
      if (state.permissionDenied) {
        return {
          structured: withDefaultDisclaimer({
            text: 'I cannot execute bank transfers, UPI payments, or trades. Please complete that action in your bank or brokerage app after confirming the details yourself.',
            warnings: [
              'Finora does not execute transfers, payments, or securities trades.',
            ],
            disclaimer: FINANCIAL_INFO_DISCLAIMER,
          }),
        };
      }
      return {
        structured: insufficientDataResponse(),
      };
    }

    // Prefer tool numbers over any LLM-invented figures when tools returned data
    const mergedNumbers =
      state.authoritativeNumbers.length > 0
        ? state.authoritativeNumbers
        : parsed.numbers;

    const text = enforceGrounding(parsed.text, state);

    return {
      structured: withDefaultDisclaimer({
        ...parsed,
        text,
        numbers: mergedNumbers,
      }),
    };
  };

  const graph = new StateGraph(FinanceAgentState)
    .addNode('intentDetection', intentDetection)
    .addNode('permissionCheck', permissionCheck)
    .addNode('toolSelection', toolSelection)
    .addNode('dataRetrieval', dataRetrieval)
    .addNode('financialCalculation', financialCalculation)
    .addNode('riskSafetyCheck', riskSafetyCheck)
    .addNode('llmResponse', llmResponse)
    .addNode('structuredResponse', structuredResponse)
    .addEdge(START, 'intentDetection')
    .addEdge('intentDetection', 'permissionCheck')
    .addEdge('permissionCheck', 'toolSelection')
    .addEdge('toolSelection', 'dataRetrieval')
    .addEdge('dataRetrieval', 'financialCalculation')
    .addEdge('financialCalculation', 'riskSafetyCheck')
    .addEdge('riskSafetyCheck', 'llmResponse')
    .addEdge('llmResponse', 'structuredResponse')
    .addEdge('structuredResponse', END);

  return graph.compile();
}

export async function runFinanceAgent(
  input: FinanceAgentInput,
  context: FinanceToolContext,
  options: FinanceAgentOptions = {}
): Promise<FinanceAgentResult> {
  const app = createFinanceAgentGraph(context, options);
  const finalState = await app.invoke({
    message: input.message,
    preferences: input.preferences,
    permissionDenied: false,
    selectedTools: [],
    toolResults: [],
    authoritativeNumbers: [],
    safetyFlags: [],
  });

  const response: AiStructuredResponse = toSharedResponse(
    finalState.structured ?? {
      text: AI_INSUFFICIENT_DATA_MESSAGE,
      disclaimer: FINANCIAL_INFO_DISCLAIMER,
    }
  );

  return {
    response,
    intent: finalState.intentResult?.intent ?? 'general_question',
    toolResults: finalState.toolResults,
    permissionDenied: finalState.permissionDenied,
    safetyFlags: finalState.safetyFlags,
  };
}

function toSharedResponse(
  structured: AiStructuredResponseParsed
): AiStructuredResponse {
  return {
    text: structured.text,
    tables: structured.tables,
    numbers: structured.numbers,
    charts: structured.charts?.map((chart) => ({
      type: chart.type,
      title: chart.title,
      data: chart.data ?? null,
    })),
    warnings: structured.warnings,
    recommendations: structured.recommendations,
    disclaimer: structured.disclaimer,
  };
}

function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

function enforceGrounding(text: string, state: AgentState): string {
  if (state.safetyFlags.includes('insufficient_tool_data')) {
    return AI_INSUFFICIENT_DATA_MESSAGE;
  }
  const intent = state.intentResult?.intent ?? 'general_question';
  // Soft guard: if tools empty somehow slipped through for data-bound intents
  if (
    !state.permissionDenied &&
    allToolsEmpty(state.toolResults) &&
    !isKnowledgeIntent(intent)
  ) {
    return AI_INSUFFICIENT_DATA_MESSAGE;
  }
  return text;
}
