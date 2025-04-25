import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserCustomPermissionDocument = UserCustomPermission & Document;

@Schema({ timestamps: true })
export class UserCustomPermission {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, ref: 'Permission' })
  permissionId!: string;

  @Prop({ required: true, enum: ['SYSTEM', 'ORGANIZATION'] })
  contextType!: 'SYSTEM' | 'ORGANIZATION';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
  contextId?: MongooseSchema.Types.ObjectId; // Optional - specific to org

  @Prop({ default: Date.now })
  grantedAt!: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  grantedById!: MongooseSchema.Types.ObjectId;

  @Prop()
  expiresAt?: Date;
}

export const UserCustomPermissionSchema =
  SchemaFactory.createForClass(UserCustomPermission);

// Add indexes
UserCustomPermissionSchema.index(
  { userId: 1, permissionId: 1, contextType: 1, contextId: 1 },
  { unique: true }
);
UserCustomPermissionSchema.index({ userId: 1 });
UserCustomPermissionSchema.index({ permissionId: 1 });
