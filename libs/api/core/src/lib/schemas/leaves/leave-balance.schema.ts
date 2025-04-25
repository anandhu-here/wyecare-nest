import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { Organization } from '../organizations/organization.schema';
import { LeaveTimeUnit } from './leave-request.schema';

export type LeaveBalanceDocument = LeaveBalance & Document;

@Schema({ timestamps: true })
export class LeaveBalance {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId | User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization!: Types.ObjectId | Organization;

  @Prop({ required: true })
  year!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  balances!: {
    [leaveType: string]: {
      // Allocated amounts in different time units
      allocations: {
        [LeaveTimeUnit.HOURS]?: number;
        [LeaveTimeUnit.DAYS]?: number;
        [LeaveTimeUnit.WEEKS]?: number;
      };

      // Used amounts in different time units
      used: {
        [LeaveTimeUnit.HOURS]?: number;
        [LeaveTimeUnit.DAYS]?: number;
        [LeaveTimeUnit.WEEKS]?: number;
      };

      // Pending amounts in different time units (for leave requests not yet approved)
      pending: {
        [LeaveTimeUnit.HOURS]?: number;
        [LeaveTimeUnit.DAYS]?: number;
        [LeaveTimeUnit.WEEKS]?: number;
      };

      // Accrual information if leave type accumulates over time
      accrual?: {
        frequency:
          | 'daily'
          | 'weekly'
          | 'monthly'
          | 'quarterly'
          | 'annually'
          | 'biweekly';
        rate: number;
        timeUnit: LeaveTimeUnit;
        maxAccumulation?: number;
        lastAccrualDate?: Date;
      };

      // Adjustment history
      adjustments?: Array<{
        date: Date;
        amount: number;
        timeUnit: LeaveTimeUnit;
        reason: string;
        authorizedBy?: Types.ObjectId | User;
      }>;
    };
  };

  @Prop([
    {
      leaveType: { type: String, required: true },
      amount: { type: Number, required: true },
      timeUnit: {
        type: String,
        required: true,
        enum: Object.values(LeaveTimeUnit),
      },
      expiryDate: { type: Date, required: true },
      source: { type: String, default: 'carryOver' }, // carryOver, adjustment, etc.
      notes: { type: String },
      _id: false,
    },
  ])
  additionalEntitlements?: Array<{
    leaveType: string;
    amount: number;
    timeUnit: LeaveTimeUnit;
    expiryDate: Date;
    source?: string;
    notes?: string;
  }>;

  @Prop()
  timezone?: string; // Organization timezone for calculations

  @Prop({ default: Date.now })
  lastUpdated!: Date;

  @Prop()
  lastCalculated?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalance);

// Add indexes
LeaveBalanceSchema.index(
  { user: 1, organization: 1, year: 1 },
  { unique: true }
);
LeaveBalanceSchema.index({ organization: 1, year: 1 });
LeaveBalanceSchema.index({ 'additionalEntitlements.expiryDate': 1 });
