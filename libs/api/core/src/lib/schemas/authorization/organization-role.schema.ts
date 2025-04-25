import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OrganizationRoleDocument = OrganizationRole & Document;

@Schema({ timestamps: true })
export class OrganizationRole {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, ref: 'Role' })
  roleId!: string;

  @Prop({ default: false })
  isPrimary!: boolean;

  @Prop({ type: Date })
  activeFrom?: Date;

  @Prop({ type: Date })
  activeTo?: Date;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assignedById?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  assignedAt!: Date;
}

export const OrganizationRoleSchema =
  SchemaFactory.createForClass(OrganizationRole);

// Add indexes
OrganizationRoleSchema.index(
  { userId: 1, organizationId: 1, roleId: 1 },
  { unique: true }
);
OrganizationRoleSchema.index({ userId: 1 });
OrganizationRoleSchema.index({ organizationId: 1 });
OrganizationRoleSchema.index({ isActive: 1 });
OrganizationRoleSchema.index({ isPrimary: 1 });
