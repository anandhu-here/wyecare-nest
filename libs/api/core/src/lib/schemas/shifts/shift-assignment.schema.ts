// api/features/src/lib/shifts/schemas/shift-assignment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ShiftAssignmentDocument = ShiftAssignment & Document;

export enum ShiftAssignmentStatus {
  ASSIGNED = 'assigned',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
  COMPLETED = 'completed',
  SIGNED = 'signed',
}

@Schema({ timestamps: true })
export class ShiftAssignment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Shift',
    required: true,
  })
  shift!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ShiftAssignmentStatus,
    default: ShiftAssignmentStatus.ASSIGNED,
  })
  status!: string;
}

export const ShiftAssignmentSchema =
  SchemaFactory.createForClass(ShiftAssignment);

// Add indexes
ShiftAssignmentSchema.index({ shift: 1, user: 1 }, { unique: true });
ShiftAssignmentSchema.index({ user: 1, status: 1 });
ShiftAssignmentSchema.index({ shift: 1, status: 1 });
ShiftAssignmentSchema.index({ status: 1 });
ShiftAssignmentSchema.index({ createdAt: -1 });
