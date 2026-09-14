import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { AiStructuredResponse } from '@finora/shared';

export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiMessageAttrs {
  role: AiMessageRole;
  content: string;
  structured?: AiStructuredResponse;
  createdAt: Date;
}

export interface AiMessageDocument extends AiMessageAttrs {
  _id: Types.ObjectId;
}

export interface AiConversationAttrs {
  userId: Types.ObjectId;
  title: string;
  messages: AiMessageDocument[];
}

export interface AiConversationDocument extends AiConversationAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MESSAGE_ROLES: AiMessageRole[] = ['user', 'assistant', 'system'];

const aiMessageSchema = new Schema<AiMessageDocument>(
  {
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true },
    structured: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const aiConversationSchema = new Schema<AiConversationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, default: 'New conversation' },
    messages: { type: [aiMessageSchema], default: [] },
  },
  { timestamps: true }
);

export type AiConversationModel = Model<AiConversationDocument>;

export const AiConversation = model<AiConversationDocument, AiConversationModel>(
  'AiConversation',
  aiConversationSchema
);
