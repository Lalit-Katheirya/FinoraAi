import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface CategoryAttrs {
  name: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  userId?: Types.ObjectId | null;
  parentId?: Types.ObjectId | null;
}

export interface CategoryDocument extends CategoryAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
    isSystem: { type: Boolean, default: false },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, userId: 1 }, { unique: true });

export type CategoryModel = Model<CategoryDocument>;

export const Category = model<CategoryDocument, CategoryModel>('Category', categorySchema);
