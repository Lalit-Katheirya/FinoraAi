import {
  AI_INSUFFICIENT_DATA_MESSAGE,
  FINANCIAL_INFO_DISCLAIMER,
  type AiStructuredResponseParsed,
} from '../schemas/response.schema';
import type { LLMChatOptions, LLMMessage, LLMProvider, StructuredLLMPayload } from './types';

/**
 * Deterministic provider for local/dev/tests when no API key is present.
 * Builds responses only from tool-result JSON embedded in the prompt.
 * Never invents financial figures.
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';

  async chat(messages: LLMMessage[], _options?: LLMChatOptions): Promise<string> {
    const joined = messages.map((m) => m.content).join('\n');
    const userMessage = extractUserMessage(joined);

    if (/Permission check FAILED|cannot execute|action_request/i.test(joined)) {
      return JSON.stringify(actionDeniedResponse());
    }

    if (isGreetingMessage(userMessage)) {
      return JSON.stringify(greetingResponse());
    }

    const toolJson = extractToolResultsJson(joined);
    let parsed: unknown = null;
    if (toolJson) {
      try {
        parsed = JSON.parse(toolJson);
      } catch {
        parsed = null;
      }
    }

    if (parsed && hasUsableToolData(parsed)) {
      return JSON.stringify(buildFromToolResults(parsed));
    }

    const knowledge = knowledgeFallback(joined, userMessage);
    if (knowledge) {
      return JSON.stringify(knowledge);
    }

    return JSON.stringify(insufficient());
  }
}

function extractToolResultsJson(text: string): string | null {
  const marker = 'Tool results (authoritative';
  const idx = text.indexOf(marker);
  if (idx >= 0) {
    const after = text.slice(idx);
    const start = indexOfJsonStart(after);
    if (start < 0) return null;
    return extractBalancedJson(after.slice(start));
  }

  const start = indexOfJsonStart(text);
  if (start < 0) return null;
  // Prefer the last top-level JSON payload in the prompt
  const lastBrace = text.lastIndexOf('{');
  const lastBracket = text.lastIndexOf('[');
  const last = Math.max(lastBrace, lastBracket);
  if (last < 0) return null;
  return extractBalancedJson(text.slice(last));
}

function indexOfJsonStart(text: string): number {
  const brace = text.indexOf('{');
  const bracket = text.indexOf('[');
  if (brace < 0) return bracket;
  if (bracket < 0) return brace;
  return Math.min(brace, bracket);
}

function extractBalancedJson(source: string): string | null {
  const open = source[0];
  if (open !== '{' && open !== '[') return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return source.slice(0, i + 1);
    }
  }
  return null;
}

function hasUsableToolData(parsed: unknown): boolean {
  if (parsed === null || parsed === undefined) return false;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return false;
    if (parsed.every((item) => isToolResult(item))) {
      return parsed.some((item) => isToolResult(item) && item.ok && !item.empty);
    }
    return true;
  }
  if (isRecord(parsed)) {
    if ('results' in parsed && Array.isArray(parsed.results)) {
      return hasUsableToolData(parsed.results);
    }
    if ('empty' in parsed && parsed.empty === true) return false;
    if ('ok' in parsed && parsed.ok === false) return false;
    return Object.keys(parsed).length > 0;
  }
  return false;
}

function isToolResult(
  value: unknown
): value is { ok: boolean; empty: boolean; data: unknown; name?: string } {
  return (
    isRecord(value) &&
    typeof value.ok === 'boolean' &&
    typeof value.empty === 'boolean'
  );
}

function buildFromToolResults(parsed: unknown): StructuredLLMPayload {
  const numbers: NonNullable<AiStructuredResponseParsed['numbers']> = [];
  const lines: string[] = [];
  const results = normalizeResults(parsed);

  for (const result of results) {
    if (!result.ok || result.empty) continue;
    appendFromData(result.name ?? 'data', result.data, numbers, lines);
  }

  if (numbers.length === 0 && lines.length === 0) {
    return insufficient();
  }

  return {
    text:
      lines.length > 0
        ? lines.join(' ')
        : 'Here is what your financial data shows based on tool results.',
    numbers: numbers.length ? numbers : undefined,
    disclaimer: FINANCIAL_INFO_DISCLAIMER,
    insufficientData: false,
  };
}

function normalizeResults(
  parsed: unknown
): Array<{ ok: boolean; empty: boolean; data: unknown; name?: string }> {
  if (Array.isArray(parsed)) {
    if (parsed.every(isToolResult)) return parsed;
    return [{ ok: true, empty: parsed.length === 0, data: parsed }];
  }
  if (isRecord(parsed) && Array.isArray(parsed.results)) {
    return normalizeResults(parsed.results);
  }
  if (isToolResult(parsed)) return [parsed];
  return [{ ok: true, empty: false, data: parsed }];
}

function appendFromData(
  name: string,
  data: unknown,
  numbers: NonNullable<AiStructuredResponseParsed['numbers']>,
  lines: string[]
): void {
  if (Array.isArray(data)) {
    lines.push(`Found ${data.length} ${name} record(s).`);
    return;
  }
  if (!isRecord(data)) return;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      numbers.push({ label: `${name}.${key}`, value });
    }
  }

  if (typeof data.savingsRatePercent === 'number') {
    lines.push(
      `Your savings rate is ${data.savingsRatePercent}% based on tool-calculated income and expenses.`
    );
  } else if (typeof data.totalBalance === 'number') {
    lines.push(
      `Financial summary: total balance ${data.totalBalance}, monthly expenses ${String(data.monthlyExpenses ?? 'n/a')}.`
    );
  } else if (typeof data.currentValue === 'number') {
    lines.push(
      `Investments: current value ${data.currentValue}, profit/loss ${String(data.profitLoss ?? 'n/a')}.`
    );
  } else if (typeof data.requiredMonthly === 'number') {
    lines.push(
      `Goal contribution: required monthly ${data.requiredMonthly}, suggested ${String(data.suggestedMonthly ?? data.requiredMonthly)}.`
    );
  } else {
    lines.push(`Retrieved ${name} data from your accounts.`);
  }
}

function insufficient(): StructuredLLMPayload {
  return {
    text: AI_INSUFFICIENT_DATA_MESSAGE,
    warnings: [AI_INSUFFICIENT_DATA_MESSAGE],
    disclaimer: FINANCIAL_INFO_DISCLAIMER,
    insufficientData: true,
  };
}

function actionDeniedResponse(): StructuredLLMPayload {
  return {
    text: 'I cannot execute bank transfers, UPI payments, or trades. Please confirm and complete that action in your bank or brokerage app. I can still help with balances, budgets, and goals using your Finora data.',
    warnings: [
      'Finora does not execute transfers, payments, or securities trades.',
    ],
    recommendations: [
      'Ask me for balances, budgets, goals, or spending summaries instead.',
    ],
    disclaimer: FINANCIAL_INFO_DISCLAIMER,
    insufficientData: false,
  };
}

function greetingResponse(): StructuredLLMPayload {
  return {
    text: "Hi — I'm Finora AI, your personal CA-style finance manager. Ask about spending, budgets, goals, India tax (80C, ITR, LTCG), stock-market basics, or your Finora accounts.",
    recommendations: [
      'Try: “Explain 80C deductions”',
      'Try: “What is my budget status?”',
      'Try: “How does SIP work?”',
    ],
    disclaimer: FINANCIAL_INFO_DISCLAIMER,
    insufficientData: false,
  };
}

function knowledgeFallback(
  prompt: string,
  userMessage: string
): StructuredLLMPayload | null {
  const intent = /Detected intent:\s*(\w+)/i.exec(prompt)?.[1] ?? '';
  const lower = `${intent} ${userMessage}`.toLowerCase();

  if (/tax_guidance|\btax\b|80c|itr|ltcg|stcg|gst|tds/.test(lower)) {
    return {
      text: 'As a CA-style guide (educational): India personal tax planning usually covers residency, income heads, slab/regime choice, deductions like 80C/80D, TDS credits, and capital-gains treatment (STCG/LTCG). Exact slabs and limits change by financial year — verify with the latest Income Tax rules or a licensed CA before filing.',
      recommendations: [
        'Share your FY and whether you want old vs new regime comparison.',
        'Ask about a specific section (80C, 80D, LTCG, Form 16).',
      ],
      disclaimer: FINANCIAL_INFO_DISCLAIMER,
      insufficientData: false,
    };
  }

  if (/market_guidance|stock market|nifty|sensex|sip|mutual[\s-]?fund|equity/.test(lower)) {
    return {
      text: 'Market literacy note: SIPs and mutual funds are ways to invest systematically; equity returns are not guaranteed and can be volatile. Diversification, time horizon, and emergency funds matter more than short-term market moves. This is education — not a buy/sell recommendation.',
      recommendations: [
        'Ask about SIP vs lump sum conceptually.',
        'Ask how to review allocation risk without guaranteeing returns.',
      ],
      disclaimer: FINANCIAL_INFO_DISCLAIMER,
      insufficientData: false,
    };
  }

  if (/ca_planning|chartered accountant|\bca\b|financial plan|wealth plan/.test(lower)) {
    return {
      text: 'CA-style planning checklist: (1) cash-flow and emergency buffer, (2) tax regime and deduction map, (3) goal funding (EMI vs SIP), (4) insurance gaps, (5) investment risk fit. Import your Finora transactions for personalized numbers; otherwise this stays educational.',
      recommendations: [
        'Add accounts/transactions for a personalized health check.',
        'Ask a focused question (tax, goals, or cash flow).',
      ],
      disclaimer: FINANCIAL_INFO_DISCLAIMER,
      insufficientData: false,
    };
  }

  if (/general_question/.test(intent) && userMessage.length > 0) {
    return {
      text: "I'm your Finora CA-style assistant. I can explain India tax and market concepts, or analyze your Finora balances, budgets, and goals when data is available. What would you like to cover?",
      recommendations: [
        'Ask a tax or market concept question.',
        'Ask for spending, budget, or goal status from your data.',
      ],
      disclaimer: FINANCIAL_INFO_DISCLAIMER,
      insufficientData: false,
    };
  }

  return null;
}

function extractUserMessage(prompt: string): string {
  const match = /User message:\s*"([^"]*)"/i.exec(prompt);
  return match?.[1]?.trim() ?? '';
}

export function isGreetingMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  return /^(hi|hii+|hello|hey|yo|namaste|good\s*(morning|afternoon|evening)|thanks|thank you|thx)([\s!,.?]|$)/i.test(
    trimmed
  ) && trimmed.length <= 40;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
