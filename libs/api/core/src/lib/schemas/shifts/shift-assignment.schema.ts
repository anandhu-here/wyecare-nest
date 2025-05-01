// libs/api/features/src/lib/shifts/schemas/shift-assignment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ShiftAssignmentDocument = ShiftAssignment & Document;

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  PARTIAL = 'partial',
}

export enum ClockEventType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end',
  CUSTOM = 'custom',
}

@Schema({ _id: false })
export class ClockEvent {
  @Prop({ required: true, enum: Object.values(ClockEventType) })
  type!: string;

  @Prop({ required: true, type: Date })
  timestamp!: Date;

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  verifiedBy?: MongooseSchema.Types.ObjectId;
}

@Schema({ _id: false })
export class BreakPeriod {
  @Prop({ required: true, type: Date })
  startTime!: Date;

  @Prop({ type: Date })
  endTime?: Date;

  @Prop()
  durationMinutes?: number;

  @Prop({ default: false })
  isPaid!: boolean;

  @Prop()
  reason?: string;
}

@Schema({ _id: false })
export class PaymentDetails {
  @Prop({ required: true })
  method!: string; // 'hourly', 'per_shift', 'daily', etc.

  @Prop({ type: Number, required: true })
  baseRate!: number;

  @Prop({ type: Number })
  hoursWorked?: number;

  @Prop({ type: Number })
  regularHours?: number;

  @Prop({ type: Number })
  overtimeHours?: number;

  @Prop({ type: Number })
  weekendHours?: number;

  @Prop({ type: Number })
  holidayHours?: number;

  @Prop({ type: Number })
  nightHours?: number;

  @Prop({ type: Number })
  overtimeRate?: number;

  @Prop({ type: Number })
  weekendRate?: number;

  @Prop({ type: Number })
  holidayRate?: number;

  @Prop({ type: Number })
  nightRate?: number;

  @Prop({ type: Number })
  totalAmount?: number;

  @Prop({
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'paid'],
  })
  status!: string;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  additionalPayments?: Record<string, any>; // For bonuses, allowances, etc.

  // currency?: string; // Optional field for currency type

  @Prop({ type: String })
  currency?: string;
}

@Schema({ _id: false })
export class ValidationResult {
  @Prop({ required: true })
  ruleId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  ruleName!: string;

  @Prop({ required: true })
  result!: 'passed' | 'warning' | 'error';

  @Prop()
  message?: string;

  @Prop({ type: Date })
  timestamp!: Date;
}

@Schema({ timestamps: true })
export class ShiftAssignment {
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
  workerId!: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ShiftType',
    required: true,
  })
  shiftTypeId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  departmentId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Location' })
  locationId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ShiftRotationPattern' })
  rotationPatternId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Date })
  scheduledStartTime!: Date;

  @Prop({ required: true, type: Date })
  scheduledEndTime!: Date;

  @Prop({ type: Number })
  scheduledDurationMinutes?: number;

  @Prop({ type: Date })
  actualStartTime?: Date;

  @Prop({ type: Date })
  actualEndTime?: Date;

  @Prop({ type: Number })
  actualDurationMinutes?: number;

  @Prop({
    required: true,
    enum: Object.values(ShiftStatus),
    default: ShiftStatus.SCHEDULED,
  })
  status!: string;

  @Prop({ type: String })
  timezone?: string;

  @Prop()
  label?: string;

  @Prop()
  notes?: string;

  @Prop({ type: [{ type: ClockEvent }] })
  clockEvents?: ClockEvent[];

  @Prop({ type: [{ type: BreakPeriod }] })
  breaks?: BreakPeriod[];

  @Prop({ type: PaymentDetails })
  paymentDetails?: PaymentDetails;

  @Prop({ type: [{ type: ValidationResult }] })
  validationResults?: ValidationResult[];

  @Prop({ type: Boolean, default: false })
  isOvertime!: boolean;

  @Prop({ type: Boolean, default: false })
  isHoliday!: boolean;

  @Prop({ type: Boolean, default: false })
  isWeekend!: boolean;

  @Prop({ type: Boolean, default: false })
  isNightShift!: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  assignedBy?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  updatedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // For industry-specific data

  @Prop({ type: [String] })
  tags?: string[];
}

export const ShiftAssignmentSchema =
  SchemaFactory.createForClass(ShiftAssignment);

// Add indexes for better query performance
ShiftAssignmentSchema.index({ organizationId: 1 });
ShiftAssignmentSchema.index({ workerId: 1 });
ShiftAssignmentSchema.index({ shiftTypeId: 1 });
ShiftAssignmentSchema.index({ status: 1 });
ShiftAssignmentSchema.index({ scheduledStartTime: 1 });
ShiftAssignmentSchema.index({ scheduledEndTime: 1 });
ShiftAssignmentSchema.index({ 'paymentDetails.status': 1 });
ShiftAssignmentSchema.index({
  organizationId: 1,
  workerId: 1,
  scheduledStartTime: 1,
});
ShiftAssignmentSchema.index({
  organizationId: 1,
  status: 1,
  scheduledStartTime: 1,
});
ShiftAssignmentSchema.index({
  organizationId: 1,
  scheduledStartTime: 1,
  scheduledEndTime: 1,
});
