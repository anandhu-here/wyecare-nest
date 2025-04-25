import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Organization } from '../organizations/organization.schema';
import { LeaveTimeUnit } from './leave-request.schema';

export type LeavePolicyDocument = LeavePolicy & Document;

export enum AccrualFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

export enum AccrualMethod {
  IMMEDIATE = 'immediate', // All at once at the start of period
  SCHEDULED = 'scheduled', // On specific dates
  PROGRESSIVE = 'progressive', // Accumulates over period
  ANNIVERSARY = 'anniversary', // Based on employee's start date
}

@Schema({ timestamps: true })
export class LeavePolicy {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization!: Types.ObjectId | Organization;

  @Prop({ required: true })
  policyName!: string;

  @Prop({ default: 'Europe/London' })
  timezone!: string;

  @Prop({ type: [String], required: true })
  applicableRoles!: string[]; // ['care', 'admin', 'other']

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User' })
  applicableUsers?: Types.ObjectId[]; // For user-specific policies

  @Prop([
    {
      name: { type: String, required: true },
      description: { type: String },
      type: { type: String, required: true },

      // Time unit configuration
      allowedTimeUnits: {
        type: [String],
        enum: Object.values(LeaveTimeUnit),
        required: true,
        default: [LeaveTimeUnit.DAYS],
      },

      // Entitlement configuration
      entitlementAmount: { type: Number, required: true },
      defaultTimeUnit: {
        type: String,
        enum: Object.values(LeaveTimeUnit),
        required: true,
        default: LeaveTimeUnit.DAYS,
      },

      // Pro-rating settings
      isProratedForNewJoiners: { type: Boolean, default: true },
      prorationMethod: {
        type: String,
        enum: ['daily', 'monthly', 'quarterly'],
        default: 'monthly',
      },

      // Accrual configuration
      accrualEnabled: { type: Boolean, default: false },
      accrualFrequency: {
        type: String,
        enum: Object.values(AccrualFrequency),
        default: AccrualFrequency.MONTHLY,
      },
      accrualMethod: {
        type: String,
        enum: Object.values(AccrualMethod),
        default: AccrualMethod.PROGRESSIVE,
      },
      accrualAmount: { type: Number },
      accrualTimeUnit: {
        type: String,
        enum: Object.values(LeaveTimeUnit),
      },
      maxAccrualAmount: { type: Number },

      // Minimum service time requirements
      minimumServiceDays: { type: Number, default: 0 },

      // Request restrictions
      maxConsecutiveTimeUnits: { type: Number },
      maxRequestsPerYear: { type: Number },
      minNoticeTimeUnits: { type: Number, default: 0 },
      minNoticeTimeUnit: {
        type: String,
        enum: Object.values(LeaveTimeUnit),
        default: LeaveTimeUnit.DAYS,
      },

      // Approval settings
      requiresApproval: { type: Boolean, required: true, default: true },
      requiresAttachment: { type: Boolean, default: false },
      attachmentRequiredAfterDays: { type: Number },

      // Partial time settings
      allowPartialTimeUnit: { type: Boolean, default: true },
      minimumPartialAmount: { type: Number },
      partialTimeIncrement: { type: Number }, // e.g., 0.5 for half-day, 0.25 for quarter-day

      // Carry-over settings
      allowCarryOver: { type: Boolean, default: false },
      carryOverLimit: { type: Number },
      carryOverTimeUnit: {
        type: String,
        enum: Object.values(LeaveTimeUnit),
        default: LeaveTimeUnit.DAYS,
      },
      carryOverExpiryMonths: { type: Number, default: 3 },
      carryOverCalculationDate: { type: Date }, // If null, use fiscal/calendar year end

      // Compensation for unused leaves
      allowPayout: { type: Boolean, default: false },
      payoutCalculation: {
        type: String,
        enum: ['full', 'partial', 'custom'],
        default: 'full',
      },
      payoutRate: { type: Number, default: 1.0 }, // Multiplier for daily rate
      payoutLimit: { type: Number },

      // Flags for special leave types
      countsTowardsServiceTime: { type: Boolean, default: true },
      affectsPerformanceCalculation: { type: Boolean, default: true },
      isSystemLeave: { type: Boolean, default: false }, // For system-generated leave like public holidays

      // UI customization
      color: { type: String },
      icon: { type: String },
      displayOrder: { type: Number },

      // Active period
      validFrom: { type: Date },
      validTo: { type: Date },

      _id: false,
    },
  ])
  leaveTypes!: Array<{
    name: string;
    description?: string;
    type: string;
    allowedTimeUnits: LeaveTimeUnit[];
    entitlementAmount: number;
    defaultTimeUnit: LeaveTimeUnit;
    isProratedForNewJoiners?: boolean;
    prorationMethod?: 'daily' | 'monthly' | 'quarterly';
    accrualEnabled?: boolean;
    accrualFrequency?: AccrualFrequency;
    accrualMethod?: AccrualMethod;
    accrualAmount?: number;
    accrualTimeUnit?: LeaveTimeUnit;
    maxAccrualAmount?: number;
    minimumServiceDays?: number;
    maxConsecutiveTimeUnits?: number;
    maxRequestsPerYear?: number;
    minNoticeTimeUnits?: number;
    minNoticeTimeUnit?: LeaveTimeUnit;
    requiresApproval: boolean;
    requiresAttachment?: boolean;
    attachmentRequiredAfterDays?: number;
    allowPartialTimeUnit?: boolean;
    minimumPartialAmount?: number;
    partialTimeIncrement?: number;
    allowCarryOver?: boolean;
    carryOverLimit?: number;
    carryOverTimeUnit?: LeaveTimeUnit;
    carryOverExpiryMonths?: number;
    carryOverCalculationDate?: Date;
    allowPayout?: boolean;
    payoutCalculation?: 'full' | 'partial' | 'custom';
    payoutRate?: number;
    payoutLimit?: number;
    countsTowardsServiceTime?: boolean;
    affectsPerformanceCalculation?: boolean;
    isSystemLeave?: boolean;
    color?: string;
    icon?: string;
    displayOrder?: number;
    validFrom?: Date;
    validTo?: Date;
  }>;

  @Prop([
    {
      name: { type: String, required: true },
      date: { type: Date, required: true },
      type: {
        type: String,
        enum: ['fixed', 'floating', 'observed'],
        required: true,
      },
      observedDate: { type: Date }, // If holiday falls on weekend and observed on another day
      description: { type: String },
      applicableRegions: [{ type: String }],
      paidLeave: { type: Boolean, default: true },
      workingHoursReduction: { type: Number }, // For partial holidays
      _id: false,
    },
  ])
  holidays!: Array<{
    name: string;
    date: Date;
    type: 'fixed' | 'floating' | 'observed';
    observedDate?: Date;
    description?: string;
    applicableRegions?: string[];
    paidLeave?: boolean;
    workingHoursReduction?: number;
  }>;

  @Prop({
    type: {
      defaultWorkingDays: { type: [String], required: true },
      defaultWorkingHours: {
        start: { type: String, required: true },
        end: { type: String, required: true },
        _id: false,
      },
      fullTimeHoursPerWeek: { type: Number, default: 40 },
      fullTimeDaysPerWeek: { type: Number, default: 5 },
      breakDuration: { type: Number, default: 60 }, // in minutes
      flexibleHours: { type: Boolean, default: false },
      shiftPatterns: [
        {
          name: { type: String },
          days: [{ type: String }],
          hours: {
            start: { type: String },
            end: { type: String },
            _id: false,
          },
          _id: false,
        },
      ],
      _id: false,
    },
  })
  workSchedule!: {
    defaultWorkingDays: string[]; // ['Monday', 'Tuesday', etc.]
    defaultWorkingHours: {
      start: string; // HH:MM format
      end: string; // HH:MM format
    };
    fullTimeHoursPerWeek: number;
    fullTimeDaysPerWeek: number;
    breakDuration: number;
    flexibleHours: boolean;
    shiftPatterns?: Array<{
      name: string;
      days: string[];
      hours: {
        start: string;
        end: string;
      };
    }>;
  };

  @Prop([
    {
      level: { type: Number, required: true },
      roles: { type: [String], required: true },
      requiresAll: { type: Boolean, default: false },
      autoApproveAfterDays: { type: Number }, // Auto-approve if no action taken after X days
      escalateAfterDays: { type: Number }, // Escalate to next level after X days
      notifyUsers: { type: [MongooseSchema.Types.ObjectId], ref: 'User' },
      _id: false,
    },
  ])
  approvalHierarchy!: Array<{
    level: number;
    roles: string[];
    requiresAll: boolean;
    autoApproveAfterDays?: number;
    escalateAfterDays?: number;
    notifyUsers?: Types.ObjectId[];
  }>;

  @Prop({
    type: {
      fiscalYearStart: {
        month: { type: Number, min: 1, max: 12, required: true },
        day: { type: Number, min: 1, max: 31, required: true },
      },
      leaveYearSameAsFiscal: { type: Boolean, default: true },
      leaveYearStart: {
        month: { type: Number, min: 1, max: 12 },
        day: { type: Number, min: 1, max: 31 },
      },
      useEmployeeAnniversary: { type: Boolean, default: false },
      accrualCalculationDay: { type: Number, min: 1, max: 31, default: 1 },
      _id: false,
    },
  })
  yearSettings!: {
    fiscalYearStart: {
      month: number; // 1-12
      day: number; // 1-31
    };
    leaveYearSameAsFiscal: boolean;
    leaveYearStart?: {
      month: number;
      day: number;
    };
    useEmployeeAnniversary: boolean;
    accrualCalculationDay: number;
  };

  @Prop({ type: MongooseSchema.Types.Mixed })
  restrictions?: {
    maximumConsecutiveDays?: number;
    minimumDaysBetweenRequests?: number;
    blackoutPeriods?: Array<{
      startDate: Date;
      endDate: Date;
      reason: string;
      leaveTypes: string[];
      exceptions?: string[];
    }>;
    maxStaffOnLeavePercentage?: number;
    maxStaffOnLeaveByDepartment?: Record<string, number>;
  };

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  effectiveFrom?: Date;

  @Prop()
  effectiveTo?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const LeavePolicySchema = SchemaFactory.createForClass(LeavePolicy);

// Add indexes
LeavePolicySchema.index({ organization: 1 });
LeavePolicySchema.index({ 'holidays.date': 1 });
LeavePolicySchema.index({ applicableRoles: 1 });
LeavePolicySchema.index({ applicableUsers: 1 });
LeavePolicySchema.index({ isActive: 1, effectiveFrom: 1, effectiveTo: 1 });
