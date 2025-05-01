import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: ['SYSTEM', 'ORGANIZATION'] })
  contextType!: 'SYSTEM' | 'ORGANIZATION';

  @Prop({ default: true })
  isSystem!: boolean;

  @Prop({ type: String, ref: 'Role' })
  baseRoleId?: string;

  @Prop({ default: false })
  isCustom!: boolean;

  @Prop({ required: true })
  hierarchyLevel!: number;

  @Prop({ type: [String], default: ['*'] })
  organizationCategories!: string[];

  @Prop({ type: Object })
  displayNames?: Record<string, string>;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Add indexes
RoleSchema.index({ id: 1 }, { unique: true });
RoleSchema.index({ contextType: 1 });
RoleSchema.index({ hierarchyLevel: 1 });
