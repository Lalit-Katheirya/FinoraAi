import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface AuditLogAttrs {
  userId: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  /** Must not contain financial amounts or secrets */
  metadata: Record<string, unknown>;
}

export interface AuditLogDocument extends AuditLogAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    resourceId: { type: String, trim: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });

export type AuditLogModel = Model<AuditLogDocument>;

export const AuditLog = model<AuditLogDocument, AuditLogModel>('AuditLog', auditLogSchema);
