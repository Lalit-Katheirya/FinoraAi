import {
  MERCHANT_CATEGORY_RULES,
  type ClassificationSource,
} from '@finora/shared';
import { categorizationRepository } from '../repositories/categorization.repository';
import { categoryRepository } from '../repositories/category.repository';
import { transactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../utils/AppError';
import { assertOwned } from '../utils/ownership';

export interface AiCategorizer {
  categorize(
    merchant: string,
    description?: string
  ): Promise<{ categoryName: string; confidence: number } | null>;
}

export interface CategorizationResult {
  categoryId?: string;
  categoryName: string;
  confidenceScore: number;
  classificationSource: ClassificationSource;
}

let aiCategorizer: AiCategorizer | null = null;

export function setAiCategorizer(categorizer: AiCategorizer | null): void {
  aiCategorizer = categorizer;
}

function matchRule(merchant: string): string | undefined {
  const upper = merchant.trim().toUpperCase();
  if (MERCHANT_CATEGORY_RULES[upper]) {
    return MERCHANT_CATEGORY_RULES[upper];
  }
  for (const [key, category] of Object.entries(MERCHANT_CATEGORY_RULES)) {
    if (upper.includes(key)) return category;
  }
  return undefined;
}

export class CategorizationService {
  async categorize(
    userId: string,
    input: { merchant: string; description?: string; useAi?: boolean }
  ): Promise<CategorizationResult | null> {
    const merchant = input.merchant.trim();
    if (!merchant) return null;

    const correction = await categorizationRepository.findCorrection(userId, merchant);
    if (correction) {
      return {
        categoryId: correction.categoryId ? String(correction.categoryId) : undefined,
        categoryName: String(correction.categoryName),
        confidenceScore: 1,
        classificationSource: 'manual',
      };
    }

    const ruleCategory = matchRule(merchant);
    if (ruleCategory) {
      const category = await categoryRepository.findByName(ruleCategory, userId);
      return {
        categoryId: category ? String(category._id) : undefined,
        categoryName: ruleCategory,
        confidenceScore: 0.95,
        classificationSource: 'rule',
      };
    }

    if (input.useAi && aiCategorizer) {
      const aiResult = await aiCategorizer.categorize(merchant, input.description);
      if (aiResult) {
        const category = await categoryRepository.findByName(aiResult.categoryName, userId);
        return {
          categoryId: category ? String(category._id) : undefined,
          categoryName: aiResult.categoryName,
          confidenceScore: aiResult.confidence,
          classificationSource: 'ai',
        };
      }
    }

    return null;
  }

  async applyCorrection(
    userId: string,
    input: {
      merchant: string;
      categoryId?: string;
      categoryName: string;
      transactionId?: string;
    }
  ) {
    let categoryId = input.categoryId;
    if (!categoryId) {
      const category = await categoryRepository.findByName(input.categoryName, userId);
      categoryId = category ? String(category._id) : undefined;
    }

    const correction = await categorizationRepository.upsertCorrection({
      userId,
      merchant: input.merchant,
      categoryId,
      categoryName: input.categoryName,
    });

    if (input.transactionId) {
      const tx = await transactionRepository.findById(input.transactionId);
      if (!tx) throw AppError.notFound('Transaction not found');
      assertOwned(String(tx.userId), userId);
      await transactionRepository.update(input.transactionId, {
        categoryId,
        categoryName: input.categoryName,
        classificationSource: 'manual',
        confidenceScore: 1,
        isReviewed: true,
      });
    }

    return {
      id: String(correction._id),
      merchant: String(correction.merchant),
      categoryId: correction.categoryId ? String(correction.categoryId) : undefined,
      categoryName: String(correction.categoryName),
    };
  }

  async listCorrections(userId: string) {
    const items = await categorizationRepository.listByUser(userId);
    return items.map((c) => ({
      id: String(c._id),
      merchant: String(c.merchant),
      categoryId: c.categoryId ? String(c.categoryId) : undefined,
      categoryName: String(c.categoryName),
    }));
  }
}

export const categorizationService = new CategorizationService();
