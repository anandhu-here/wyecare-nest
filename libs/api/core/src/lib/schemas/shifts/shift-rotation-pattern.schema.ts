// libs/api/features/src/lib/shifts/schemas/shift-rotation-pattern.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrganizationCategory } from './shift-type.schema';

export type ShiftRotationPatternDocument = ShiftRotationPattern & Document;

@Schema({ _id: false })
export class RotationSequenceItem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ShiftType',
    required: true,
  })
  shiftTypeId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, required: true, default: 1 })
  consecutiveDays!: number;

  @Prop({ type: Boolean, default: false })
  isFlexible!: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

@Schema({ _id: false })
export class RotationBreak {
  @Prop({ type: Number, required: true, default: 1 })
  durationDays!: number;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Boolean, default: false })
  isPaid!: boolean;
}

@Schema({ timestamps: true })
export class ShiftRotationPattern {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(OrganizationCategory) })
  category?: string;

  @Prop()
  departmentId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: [RotationSequenceItem], required: true })
  sequence!: RotationSequenceItem[]; // Ordered sequence of shift types

  @Prop({ type: [RotationBreak] })
  breaks?: RotationBreak[]; // Breaks within the rotation pattern

  @Prop({ type: Number, required: true })
  cycleLength!: number; // Total length of rotation cycle in days

  @Prop({ type: Boolean, default: false })
  repeatIndefinitely!: boolean;

  @Prop({ type: Number })
  maxRepetitions?: number; // Maximum number of cycle repetitions for a staff member

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
  })
  applicableStaff?: MongooseSchema.Types.ObjectId[]; // Staff to whom this rotation applies

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Role' }],
  })
  applicableRoles?: MongooseSchema.Types.ObjectId[]; // Roles to which this rotation applies

  @Prop({ type: Date })
  effectiveFrom?: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Boolean, default: false })
  isSystem!: boolean; // Indicates if this is a system-provided template

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const ShiftRotationPatternSchema =
  SchemaFactory.createForClass(ShiftRotationPattern);

// Add indexes
ShiftRotationPatternSchema.index({ organizationId: 1 });
ShiftRotationPatternSchema.index({ category: 1 });
ShiftRotationPatternSchema.index({ departmentId: 1 });
ShiftRotationPatternSchema.index({ isActive: 1 });
ShiftRotationPatternSchema.index({
  organizationId: 1,
  isActive: 1,
});
ShiftRotationPatternSchema.index({ 'sequence.shiftTypeId': 1 });
ShiftRotationPatternSchema.index({ applicableStaff: 1 });
ShiftRotationPatternSchema.index({ applicableRoles: 1 });
