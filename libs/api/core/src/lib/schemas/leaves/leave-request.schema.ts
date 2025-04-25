import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { Organization } from '../organizations/organization.schema';

export type LeaveRequestDocument = LeaveRequest & Document;

export enum LeaveTimeUnit {
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  INVALIDATED = 'invalidated',
}

@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId | User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization!: Types.ObjectId | Organization;

  @Prop({ required: true })
  leaveType!: string;

  @Prop({
    required: true,
    enum: Object.values(LeaveStatus),
    default: LeaveStatus.PENDING,
  })
  status!: LeaveStatus;

  @Prop({ required: true })
  startDateTime!: Date;

  @Prop({ required: true })
  endDateTime!: Date;

  @Prop({
    required: true,
    enum: Object.values(LeaveTimeUnit),
    default: LeaveTimeUnit.DAYS,
  })
  timeUnit!: LeaveTimeUnit;

  @Prop({ required: true })
  amount!: number; // Amount in the specified timeUnit

  @Prop({ required: true })
  reason!: string;

  @Prop([String])
  attachments?: string[]; // URLs to medical certificates or other documents

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId | User;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  comments?: string;

  @Prop()
  cancellationReason?: string;

  @Prop({
    type: {
      requestSubmitted: { type: Boolean, default: false },
      requestApproved: { type: Boolean, default: false },
      requestRejected: { type: Boolean, default: false },
      reminderSent: { type: Boolean, default: false },
    },
    _id: false,
  })
  notificationsSent!: {
    requestSubmitted?: boolean;
    requestApproved?: boolean;
    requestRejected?: boolean;
    reminderSent?: boolean;
  };

  @Prop()
  timezone?: string; // Store the timezone used when creating the request

  // For recurring leaves
  @Prop({ default: false })
  isRecurring!: boolean;

  @Prop({
    type: {
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      interval: { type: Number }, // Every X days/weeks/months
      endDate: { type: Date },
      daysOfWeek: [{ type: Number }], // 0-6, Sunday to Saturday
      exceptions: [{ type: Date }], // Dates to exclude
    },
    _id: false,
  })
  recurringPattern?: {
    frequency?: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    endDate?: Date;
    daysOfWeek?: number[];
    exceptions?: Date[];
  };

  // For half-day or hourly leaves
  @Prop({ default: false })
  isPartialTimeUnit!: boolean;

  @Prop({
    type: {
      startTime: { type: Date },
      endTime: { type: Date },
      hoursRequested: { type: Number },
      timeSlots: [
        {
          date: { type: Date },
          startTime: { type: String }, // HH:MM format
          endTime: { type: String }, // HH:MM format
          hoursCount: { type: Number },
          _id: false,
        },
      ],
    },
    _id: false,
  })
  partialTimeDetails?: {
    startTime?: Date;
    endTime?: Date;
    hoursRequested?: number;
    timeSlots?: Array<{
      date: Date;
      startTime: string;
      endTime: string;
      hoursCount: number;
    }>;
  };

  // For approval workflow
  @Prop([
    {
      level: { type: Number },
      approver: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'] },
      comments: { type: String },
      timestamp: { type: Date },
      _id: false,
    },
  ])
  approvalFlow?: Array<{
    level: number;
    approver: Types.ObjectId | User;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    timestamp: Date;
  }>;

  @Prop()
  currentApprovalLevel?: number;

  @Prop()
  overlappingLeaves?: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

// Add indexes
LeaveRequestSchema.index({ user: 1, organization: 1 });
LeaveRequestSchema.index({ organization: 1, status: 1 });
LeaveRequestSchema.index({ startDateTime: 1, endDateTime: 1 });
LeaveRequestSchema.index({ user: 1, status: 1, startDateTime: 1 });
LeaveRequestSchema.index({ user: 1, leaveType: 1, startDateTime: 1 });
