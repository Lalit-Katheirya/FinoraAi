export type {
  LLMProvider,
  LLMProviderConfig,
  LLMMessage,
  LLMChatOptions,
  LLMRole,
  LLMProviderKind,
  StructuredLLMPayload,
} from './providers';
export {
  createLLMProvider,
  MockLLMProvider,
  OpenAILLMProvider,
} from './providers';

export {
  AI_INSUFFICIENT_DATA_MESSAGE,
  FINANCIAL_INFO_DISCLAIMER,
  aiStructuredResponseSchema,
  insufficientDataResponse,
  parseStructuredResponse,
  withDefaultDisclaimer,
} from './schemas/response.schema';
export type { AiStructuredResponseParsed } from './schemas/response.schema';

export {
  financeIntentSchema,
  intentDetectionSchema,
  detectIntentHeuristic,
} from './schemas/intent.schema';
export type { FinanceIntent, IntentDetectionResult } from './schemas/intent.schema';

export { SAFETY_SYSTEM_RULES, buildSystemPrompt } from './prompts/system';
export { buildFinancePrompt, INTENT_PROMPT_HINTS, isKnowledgeIntent } from './prompts/finance';

export type {
  FinanceToolContext,
  FinanceToolName,
  ToolCallRequest,
  ToolCallResult,
  DateRangeFilter,
  CategorySpendingItem,
  MonthlyExpenseSummary,
  GoalContributionResult,
  InvestmentSummary,
  SavingsRateResult,
  UnusualTransaction,
  FinancialSummary,
  CashFlowForecast,
  CashFlowForecastPoint,
} from './tools';
export {
  FINANCE_TOOL_DEFINITIONS,
  selectToolsForIntent,
  executeToolCall,
  executeToolCalls,
  allToolsEmpty,
  collectAuthoritativeNumbers,
} from './tools';

export {
  createFinanceAgentGraph,
  runFinanceAgent,
} from './agents/finance-agent';
export type {
  FinanceAgentInput,
  FinanceAgentResult,
  FinanceAgentOptions,
} from './agents/finance-agent';

export { runFinanceChat } from './workflows/chat.workflow';
export type {
  FinanceChatInput,
  FinanceChatResult,
} from './workflows/chat.workflow';

export {
  InMemoryPreferenceStore,
  emptyPreferences,
  mergeInteractionPreferences,
} from './memory/preferences';
export type {
  PreferenceStore,
  UserPreferenceMemory,
  InteractionPreferences,
  GoalPreference,
} from './memory/preferences';

export { FinanceAgentService } from './services/finance-agent.service';
export type { FinanceAgentServiceOptions } from './services/finance-agent.service';
