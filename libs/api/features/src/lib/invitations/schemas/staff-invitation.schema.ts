import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffInvitationDocument = StaffInvitation & Document;

@Schema({ timestamps: true })
export class StaffInvitation {
  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  role!: string;

  @Prop()
  message?: string;

  @Prop({ required: true })
  token!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acceptedBy?: Types.ObjectId;

  @Prop()
  acceptedAt?: Date;

  @Prop({ enum: ['pending', 'accepted', 'expired'], default: 'pending' })
  status!: string;
}

export const StaffInvitationSchema =
  SchemaFactory.createForClass(StaffInvitation);
