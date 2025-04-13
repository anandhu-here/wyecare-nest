import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionImplicationDocument = PermissionImplication & Document;

@Schema({ timestamps: true })
export class PermissionImplication {
  @Prop({ required: true, ref: 'Permission' })
  parentPermissionId!: string;

  @Prop({ required: true, ref: 'Permission' })
  childPermissionId!: string;
}

export const PermissionImplicationSchema = SchemaFactory.createForClass(
  PermissionImplication
);

// Add indexes
PermissionImplicationSchema.index(
  { parentPermissionId: 1, childPermissionId: 1 },
  { unique: true }
);
PermissionImplicationSchema.index({ parentPermissionId: 1 });
PermissionImplicationSchema.index({ childPermissionId: 1 });
