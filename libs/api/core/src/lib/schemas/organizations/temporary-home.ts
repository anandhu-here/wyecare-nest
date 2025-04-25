import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import * as crypto from 'crypto';

export type TemporaryHomeDocument = TemporaryHome & Document;

@Schema({ timestamps: true })
export class TemporaryHome {
  @Prop({ required: true })
  name!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  createdByAgency!: Types.ObjectId;

  @Prop({ unique: true, required: true })
  temporaryId!: string;

  @Prop({ default: false })
  isClaimed!: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  })
  claimedBy!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TemporaryHomeSchema = SchemaFactory.createForClass(TemporaryHome);

// Add indexes
TemporaryHomeSchema.index({ temporaryId: 1 }, { unique: true });
TemporaryHomeSchema.index({ createdByAgency: 1 });
TemporaryHomeSchema.index({ name: 1 });
TemporaryHomeSchema.index({ isClaimed: 1 });
TemporaryHomeSchema.index({ createdAt: -1 });
TemporaryHomeSchema.index({ claimedBy: 1 }, { sparse: true });

// Static methods need to be implemented differently in NestJS
// We'll implement them in a service instead of schema statics

/**
 * Generates a temporary ID for a temporary home
 * @param agencyId The agency ID
 * @returns A formatted temporary ID
 */
export function generateTemporaryId(agencyId: string): string {
  // Extract the last 8 chars of the agency ID
  const agencyIdStr = agencyId.toString();
  const shortAgencyId = agencyIdStr.substring(agencyIdStr.length - 8);

  // Generate a random 6-character string
  const randomStr = crypto.randomBytes(3).toString('hex');

  // Combine with a prefix
  return `TCHOME-${shortAgencyId}-${randomStr}`;
}
