// staff-rate.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ShiftPaymentMethod } from './shift-payment.schema';

export type StaffRateDocument = StaffRate & Document;

@Schema({ timestamps: true })
export class StaffRate {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ShiftType',
  })
  shiftTypeId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PaymentConfig',
  })
  paymentConfigId?: MongooseSchema.Types.ObjectId;

  @Prop({ enum: Object.values(ShiftPaymentMethod) })
  paymentMethod?: string;

  @Prop({ type: Number })
  overrideRate?: number;

  @Prop({ type: Number })
  bonusRate?: number;

  @Prop({ type: Object })
  customRateParams?: Record<string, any>;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  effectiveFrom?: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  // Legacy fields for backward compatibility
  @Prop({ type: String })
  userType?: string;

  @Prop({ type: Number })
  legacyRate?: number;
}

export const StaffRateSchema = SchemaFactory.createForClass(StaffRate);

// Add indexes
StaffRateSchema.index({ organizationId: 1 });
StaffRateSchema.index({ userId: 1 });
StaffRateSchema.index({ shiftTypeId: 1 });
StaffRateSchema.index({ paymentConfigId: 1 });
StaffRateSchema.index({ paymentMethod: 1 });
StaffRateSchema.index({ isActive: 1 });
StaffRateSchema.index({
  organizationId: 1,
  userId: 1,
  shiftTypeId: 1,
  isActive: 1,
});
