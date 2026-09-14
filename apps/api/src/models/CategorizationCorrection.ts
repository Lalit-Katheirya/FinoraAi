import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface CategorizationCorrectionAttrs {
  userId: Types.ObjectId;
  merchant: string;
  merchantNormalized: string;
  categoryId?: Types.ObjectId;
  categoryName: string;
  count: number;
}

export interface CategorizationCorrectionDocument
  extends CategorizationCorrectionAttrs,
    Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorizationCorrectionSchema = new Schema<CategorizationCorrectionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    merchant: { type: String, required: true, trim: true },
    merchantNormalized: { type: String, required: true, trim: true, uppercase: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    categoryName: { type: String, required: true, trim: true },
    count: { type: Number, required: true, default: 1, min: 1 },
  },
  { timestamps: true }
);

categorizationCorrectionSchema.index({ userId: 1, merchantNormalized: 1 }, { unique: true });

export type CategorizationCorrectionModel = Model<CategorizationCorrectionDocument>;

export const CategorizationCorrection = model<
  CategorizationCorrectionDocument,
  CategorizationCorrectionModel
>('CategorizationCorrection', categorizationCorrectionSchema);
