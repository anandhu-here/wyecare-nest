// libs/api/features/src/lib/timesheets/schemas/timesheet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TimesheetDocument = Timesheet & Document;

export enum TimesheetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

export enum TimesheetPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

@Schema({ _id: false })
export class TimesheetSummary {
  @Prop({ type: Number, default: 0 })
  totalShifts!: number;

  @Prop({ type: Number, default: 0 })
  scheduledMinutes!: number;

  @Prop({ type: Number, default: 0 })
  actualMinutes!: number;

  @Prop({ type: Number, default: 0 })
  regularMinutes!: number;

  @Prop({ type: Number, default: 0 })
  overtimeMinutes!: number;

  @Prop({ type: Number, default: 0 })
  weekendMinutes!: number;

  @Prop({ type: Number, default: 0 })
  holidayMinutes!: number;

  @Prop({ type: Number, default: 0 })
  nightMinutes!: number;

  @Prop({ type: Number, default: 0 })
  breakMinutes!: number;

  @Prop({ type: Number, default: 0 })
  paidBreakMinutes!: number;

  @Prop({ type: Number, default: 0 })
  unpaidBreakMinutes!: number;
}

@Schema({ _id: false })
export class PaymentSummary {
  @Prop({ type: Number, default: 0 })
  baseAmount!: number;

  @Prop({ type: Number, default: 0 })
  overtimeAmount!: number;

  @Prop({ type: Number, default: 0 })
  weekendAmount!: number;

  @Prop({ type: Number, default: 0 })
  holidayAmount!: number;

  @Prop({ type: Number, default: 0 })
  nightAmount!: number;

  @Prop({ type: Number, default: 0 })
  bonusAmount!: number;

  @Prop({ type: Number, default: 0 })
  deductionAmount!: number;

  @Prop({ type: Number, default: 0 })
  totalAmount!: number;

  @Prop({ type: String, default: 'default' })
  currency!: string;
}

@Schema({ _id: false })
export class ApprovalHistory {
  @Prop({ required: true })
  status!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  timestamp!: Date;

  @Prop()
  comments?: string;
}

@Schema({ timestamps: true })
export class Timesheet {
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
    ref: 'Department',
  })
  departmentId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(TimesheetPeriod) })
  periodType!: string;

  @Prop({ required: true, type: Date })
  periodStart!: Date;

  @Prop({ required: true, type: Date })
  periodEnd!: Date;

  @Prop({ type: Number })
  weekNumber?: number;

  @Prop({ type: Number })
  monthNumber?: number;

  @Prop({ type: Number })
  year!: number;

  @Prop({
    required: true,
    enum: Object.values(TimesheetStatus),
    default: TimesheetStatus.DRAFT,
  })
  status!: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'ShiftAssignment' }],
  })
  shiftAssignments!: MongooseSchema.Types.ObjectId[];

  @Prop({ type: TimesheetSummary, required: true, default: {} })
  summary!: TimesheetSummary;

  @Prop({ type: PaymentSummary, required: true, default: {} })
  paymentSummary!: PaymentSummary;

  @Prop({ type: [ApprovalHistory] })
  approvalHistory?: ApprovalHistory[];

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  submittedBy?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  approvedBy?: MongooseSchema.Types.ObjectId;

  @Prop()
  notes?: string;

  @Prop({ type: String })
  payrollReference?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // For industry-specific data
}

export const TimesheetSchema = SchemaFactory.createForClass(Timesheet);

// Add indexes for better query performance
TimesheetSchema.index({ organizationId: 1 });
TimesheetSchema.index({ workerId: 1 });
TimesheetSchema.index({ status: 1 });
TimesheetSchema.index({ periodStart: 1 });
TimesheetSchema.index({ periodEnd: 1 });
TimesheetSchema.index({ year: 1, monthNumber: 1 });
TimesheetSchema.index({ year: 1, weekNumber: 1 });
TimesheetSchema.index({ organizationId: 1, status: 1 });
TimesheetSchema.index(
  { organizationId: 1, workerId: 1, periodStart: 1, periodEnd: 1 },
  { unique: true }
);
