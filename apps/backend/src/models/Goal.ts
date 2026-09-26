import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { GoalPriority } from '@finora/shared';

const GOAL_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high'];

export interface GoalAttrs {
  userId: Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  priority: GoalPriority;
  category: string;
}

export interface GoalDocument extends GoalAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<GoalDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    monthlyContribution: { type: Number, required: true, default: 0, min: 0 },
    priority: { type: String, enum: GOAL_PRIORITIES, default: 'medium' },
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type GoalModel = Model<GoalDocument>;

export const Goal = model<GoalDocument, GoalModel>('Goal', goalSchema);
