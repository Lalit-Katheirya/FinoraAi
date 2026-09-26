import { CategorizationCorrection } from '../models';

export interface CreateCorrectionInput {
  userId: string;
  merchant: string;
  categoryId?: string;
  categoryName: string;
}

export class CategorizationRepository {
  async findCorrection(userId: string, merchant: string) {
    const normalized = merchant.trim().toUpperCase();
    return CategorizationCorrection.findOne({
      userId,
      merchantNormalized: normalized,
    }).exec();
  }

  async upsertCorrection(data: CreateCorrectionInput) {
    const merchantNormalized = data.merchant.trim().toUpperCase();
    return CategorizationCorrection.findOneAndUpdate(
      { userId: data.userId, merchantNormalized },
      {
        $set: {
          userId: data.userId,
          merchant: data.merchant,
          merchantNormalized,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
        },
        $inc: { count: 1 },
      },
      { upsert: true, new: true }
    ).exec();
  }

  async listByUser(userId: string) {
    return CategorizationCorrection.find({ userId }).sort({ updatedAt: -1 }).exec();
  }
}

export const categorizationRepository = new CategorizationRepository();
