// organizations/schemas/staff-invitation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StaffInvitationDocument = StaffInvitation & Document;

@Schema({ timestamps: true })
export class StaffInvitation {
  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  firstName?: string;

  @Prop({ required: true })
  lastName?: string;

  @Prop({ required: true })
  role!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  token!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  invitedBy!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  acceptedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  acceptedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['pending', 'accepted', 'expired'] })
  status!: 'pending' | 'accepted' | 'expired';

  @Prop()
  message?: string;
}

export const StaffInvitationSchema =
  SchemaFactory.createForClass(StaffInvitation);

// Add indexes
StaffInvitationSchema.index({ email: 1, organizationId: 1 }, { unique: true });
StaffInvitationSchema.index({ token: 1 }, { unique: true });
StaffInvitationSchema.index({ status: 1 });
StaffInvitationSchema.index({ expiresAt: 1 });
