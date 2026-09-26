import { z } from 'zod';

export const AI_INSUFFICIENT_DATA_MESSAGE =
  "I don't have enough data to answer that accurately.";

export const FINANCIAL_INFO_DISCLAIMER =
  'Educational guidance only — not a formal CA certificate, tax filing, audit opinion, or licensed investment advisory engagement. Verify with the latest official rules or a qualified professional before acting. Finora never executes bank transfers, UPI payments, or securities trades on your behalf.';

export const responseTableSchema = z.object({
  title: z.string(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

export const responseNumberSchema = z.object({
  label: z.string(),
  value: z.number(),
  currency: z.string().optional(),
});

export const responseChartSchema = z.object({
  type: z.string(),
  title: z.string(),
  data: z.unknown().default(null),
});

export const aiStructuredResponseSchema = z.object({
  text: z.string().min(1),
  tables: z.array(responseTableSchema).optional(),
  numbers: z.array(responseNumberSchema).optional(),
  charts: z.array(responseChartSchema).optional(),
  warnings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  disclaimer: z.string().optional(),
  insufficientData: z.boolean().optional(),
});

export type AiStructuredResponseParsed = z.infer<typeof aiStructuredResponseSchema>;

export function parseStructuredResponse(raw: string): AiStructuredResponseParsed | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = aiStructuredResponseSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function withDefaultDisclaimer(
  response: AiStructuredResponseParsed
): AiStructuredResponseParsed {
  return {
    ...response,
    disclaimer: response.disclaimer ?? FINANCIAL_INFO_DISCLAIMER,
  };
}

export function insufficientDataResponse(
  detail?: string
): AiStructuredResponseParsed {
  return {
    text: detail
      ? `${AI_INSUFFICIENT_DATA_MESSAGE} ${detail}`
      : AI_INSUFFICIENT_DATA_MESSAGE,
    warnings: [AI_INSUFFICIENT_DATA_MESSAGE],
    disclaimer: FINANCIAL_INFO_DISCLAIMER,
    insufficientData: true,
  };
}
