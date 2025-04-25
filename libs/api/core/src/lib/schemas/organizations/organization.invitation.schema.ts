import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrganizationInvitationDocument = OrganizationInvitation & Document;

@Schema({ timestamps: true })
export class OrganizationInvitation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  token!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  invitedBy!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ required: true, ref: 'Role' })
  role!: string;

  @Prop()
  message?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending',
  })
  status!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  acceptedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  acceptedAt?: Date;
}

export const OrganizationInvitationSchema = SchemaFactory.createForClass(
  OrganizationInvitation
);

// Add indexes
OrganizationInvitationSchema.index({ organization: 1, email: 1, status: 1 });
OrganizationInvitationSchema.index({ token: 1 });
OrganizationInvitationSchema.index({ expiresAt: 1 });
