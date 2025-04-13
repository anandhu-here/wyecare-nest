import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ timestamps: true })
export class RolePermission {
  @Prop({ required: true, ref: 'Role' })
  roleId!: string;

  @Prop({ required: true, ref: 'Permission' })
  permissionId!: string;
}

export const RolePermissionSchema =
  SchemaFactory.createForClass(RolePermission);

// Add indexes
RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });
RolePermissionSchema.index({ roleId: 1 });
RolePermissionSchema.index({ permissionId: 1 });
