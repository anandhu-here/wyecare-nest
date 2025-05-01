// super-admin/schemas/organization-creation-invitation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrganizationCreationInvitationDocument =
  OrganizationCreationInvitation & Document;

@Schema({ timestamps: true })
export class OrganizationCreationInvitation {
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
  roleToAssign!: string;

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

  // Add organization type
  @Prop({
    required: true,
    enum: [
      'care_home',
      'hospital',
      'education',
      'healthcare',
      'social_services',
      'retail',
      'service_provider',
      'other',
    ],
  })
  organizationType!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  acceptedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  acceptedAt?: Date;
}

export const OrganizationCreationInvitationSchema =
  SchemaFactory.createForClass(OrganizationCreationInvitation);

// Add indexes
OrganizationCreationInvitationSchema.index({ email: 1, status: 1 });
OrganizationCreationInvitationSchema.index({ token: 1 });
OrganizationCreationInvitationSchema.index({ expiresAt: 1 });
OrganizationCreationInvitationSchema.index({ organizationType: 1 }); // Add index for organization type
