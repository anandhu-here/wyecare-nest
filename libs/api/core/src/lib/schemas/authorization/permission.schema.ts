import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  // Optional display name mappings by organization category
  @Prop({ type: Object, default: {} })
  displayNames?: Record<string, string>;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  category!: string;

  // New field for applicable organization categories
  @Prop({ type: [String], default: ['*'] })
  organizationCategories!: string[];

  @Prop({ required: true, enum: ['SYSTEM', 'ORGANIZATION'] })
  contextType!: 'SYSTEM' | 'ORGANIZATION';

  @Prop({ default: true })
  isSystem!: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Add indexes
PermissionSchema.index({ id: 1 }, { unique: true });
PermissionSchema.index({ category: 1 });
PermissionSchema.index({ contextType: 1 });
