import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  id!: string; // e.g., "ORGANIZATION_ADMIN"

  @Prop({ required: true })
  name!: string; // Human-readable name

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: ['SYSTEM', 'ORGANIZATION'] })
  contextType!: 'SYSTEM' | 'ORGANIZATION';

  @Prop({ default: true })
  isSystem!: boolean; // True for built-in roles

  @Prop({ type: String, ref: 'Role' })
  baseRoleId?: string; // Optional parent role for inheritance

  @Prop({ default: false })
  isCustom!: boolean;

  @Prop({ required: true })
  hierarchyLevel!: number; // Lower number = higher authority
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Add indexes
RoleSchema.index({ id: 1 }, { unique: true });
RoleSchema.index({ contextType: 1 });
RoleSchema.index({ hierarchyLevel: 1 });
