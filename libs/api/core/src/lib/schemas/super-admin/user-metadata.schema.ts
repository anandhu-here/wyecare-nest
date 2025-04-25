// super-admin/schemas/user-metadata.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserMetadataDocument = UserMetadata & Document;

@Schema({ timestamps: true })
export class UserMetadata {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop()
  pendingOrgRole?: string;

  @Prop()
  pendingOrgRoleGrantedAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  pendingOrgRoleGrantedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  additionalData?: Record<string, any>;
}

export const UserMetadataSchema = SchemaFactory.createForClass(UserMetadata);

// Add indexes
UserMetadataSchema.index({ userId: 1 }, { unique: true });
