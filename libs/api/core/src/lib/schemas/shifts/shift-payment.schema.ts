// payment-config.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ShiftPaymentConfigDocument = ShiftPaymentConfig & Document;

export enum ShiftPaymentMethod {
  HOURLY = 'hourly',
  PER_SHIFT = 'per_shift',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  PERFORMANCE = 'performance',
  COMMISSION = 'commission',
  CUSTOM = 'custom',
}

@Schema({ _id: false })
export class HourlyRateConfig {
  @Prop({ type: Number, required: true })
  baseRate!: number;

  @Prop({ type: Number, default: 0 })
  overtimeMultiplier?: number;

  @Prop({ type: Number, default: 0 })
  weekendRate?: number;

  @Prop({ type: Number, default: 0 })
  holidayRate?: number;

  @Prop({ type: Number, default: 0 })
  nightDifferential?: number;
}

@Schema({ _id: false })
export class FixedRateConfig {
  @Prop({ type: Number, required: true })
  baseAmount!: number;

  @Prop({ type: Number, default: 0 })
  weekendBonus?: number;

  @Prop({ type: Number, default: 0 })
  holidayBonus?: number;
}

@Schema({ _id: false })
export class CommissionConfig {
  @Prop({ type: Number, default: 0 })
  baseAmount?: number;

  @Prop({ type: Number, required: true })
  commissionRate!: number;

  @Prop({ type: String })
  commissionType?: string; // percentage, fixed, tiered
}

@Schema({ _id: false })
export class RecurringRateConfig {
  @Prop({ type: Number, required: true })
  baseAmount!: number;

  @Prop({ type: String, required: true, enum: ['daily', 'weekly', 'monthly'] })
  period!: string;

  @Prop({ type: Number })
  workingDaysPerPeriod?: number;

  @Prop({ type: Number })
  workingHoursPerPeriod?: number;
}

@Schema({ _id: false })
export class CustomRateConfig {
  @Prop({ type: String })
  formula?: string;

  @Prop({ type: Object })
  parameters?: Record<string, any>;
}

@Schema({ timestamps: true, discriminatorKey: 'paymentMethod' })
export class ShiftPaymentConfig {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ShiftType',
    required: true,
  })
  shiftTypeId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(ShiftPaymentMethod) })
  paymentMethod!: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  effectiveFrom?: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ type: String, default: 'default' })
  currency!: string;

  // Specific config objects will be populated based on discriminator
  @Prop({ type: HourlyRateConfig })
  hourlyConfig?: HourlyRateConfig;

  @Prop({ type: FixedRateConfig })
  fixedConfig?: FixedRateConfig;

  @Prop({ type: CommissionConfig })
  commissionConfig?: CommissionConfig;

  @Prop({ type: RecurringRateConfig })
  recurringConfig?: RecurringRateConfig;

  @Prop({ type: CustomRateConfig })
  customConfig?: CustomRateConfig;

  // Legacy fields for backward compatibility
  @Prop({ type: Object })
  legacyRates?: Record<string, any>;
}

export const ShiftPaymentConfigSchema =
  SchemaFactory.createForClass(ShiftPaymentConfig);

// Add indexes
ShiftPaymentConfigSchema.index({ organizationId: 1 });
ShiftPaymentConfigSchema.index({ shiftTypeId: 1 });
ShiftPaymentConfigSchema.index({ paymentMethod: 1 });
ShiftPaymentConfigSchema.index({ isActive: 1 });
ShiftPaymentConfigSchema.index(
  { organizationId: 1, shiftTypeId: 1, isActive: 1 },
  { unique: true }
);

// This will enable polymorphic documents
export const ShiftPaymentConfigModel = (mongoose: any) => {
  const model = mongoose.model('ShiftPaymentConfig', ShiftPaymentConfigSchema);

  // Create discriminators for each payment method
  model.discriminator(
    ShiftPaymentMethod.HOURLY,
    new mongoose.Schema({
      hourlyConfig: { type: HourlyRateConfig, required: true },
    })
  );

  model.discriminator(
    ShiftPaymentMethod.PER_SHIFT,
    new mongoose.Schema({
      fixedConfig: { type: FixedRateConfig, required: true },
    })
  );

  model.discriminator(
    ShiftPaymentMethod.COMMISSION,
    new mongoose.Schema({
      commissionConfig: { type: CommissionConfig, required: true },
    })
  );

  model.discriminator(
    ShiftPaymentMethod.DAILY,
    new mongoose.Schema({
      recurringConfig: { type: RecurringRateConfig, required: true },
    })
  );

  model.discriminator(
    ShiftPaymentMethod.WEEKLY,
    new mongoose.Schema({
      recurringConfig: { type: RecurringRateConfig, required: true },
    })
  );

  model.discriminator(
    ShiftPaymentMethod.MONTHLY,
    new mongoose.Schema({
      recurringConfig: { type: RecurringRateConfig, required: true },
    })
  );

  model.discriminator(
    ShiftPaymentMethod.CUSTOM,
    new mongoose.Schema({
      customConfig: { type: CustomRateConfig, required: true },
    })
  );

  return model;
};
