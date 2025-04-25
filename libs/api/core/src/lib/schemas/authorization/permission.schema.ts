import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true })
  id!: string; // e.g., "view_staff"

  @Prop({ required: true })
  name!: string; // Human-readable name e.g., "View Staff"

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  category!: string; // e.g., "user", "organization", etc.

  @Prop({ required: true, enum: ['SYSTEM', 'ORGANIZATION'] })
  contextType!: 'SYSTEM' | 'ORGANIZATION';

  @Prop({ default: true })
  isSystem!: boolean; // True for built-in permissions
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Add indexes
PermissionSchema.index({ id: 1 }, { unique: true });
PermissionSchema.index({ category: 1 });
PermissionSchema.index({ contextType: 1 });
