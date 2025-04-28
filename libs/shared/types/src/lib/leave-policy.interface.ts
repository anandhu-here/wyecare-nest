import { Types, Document } from 'mongoose';
import { IOrganization as Organization } from './organization.interface';
import { LeaveTimeUnit } from './leave-request.interface';

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

export type ProrationMethod = 'daily' | 'monthly' | 'quarterly';
export type PayoutCalculation = 'full' | 'partial' | 'custom';
export type HolidayType = 'fixed' | 'floating' | 'observed';

// Leave Type interface
export interface LeaveType {
  name: string;
  description?: string;
  type: string;
  allowedTimeUnits: LeaveTimeUnit[];
  entitlementAmount: number;
  defaultTimeUnit: LeaveTimeUnit;
  isProratedForNewJoiners?: boolean;
  prorationMethod?: ProrationMethod;
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
  payoutCalculation?: PayoutCalculation;
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
}

// Holiday interface
export interface Holiday {
  name: string;
  date: Date;
  type: HolidayType;
  observedDate?: Date;
  description?: string;
  applicableRegions?: string[];
  paidLeave?: boolean;
  workingHoursReduction?: number;
}

// Shift Pattern interface
export interface ShiftPattern {
  name: string;
  days: string[];
  hours: {
    start: string;
    end: string;
  };
}

// Work Schedule interface
export interface WorkSchedule {
  defaultWorkingDays: string[]; // ['Monday', 'Tuesday', etc.]
  defaultWorkingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  fullTimeHoursPerWeek: number;
  fullTimeDaysPerWeek: number;
  breakDuration: number;
  flexibleHours: boolean;
  shiftPatterns?: ShiftPattern[];
}

// Approval Hierarchy Level interface
export interface ApprovalHierarchyLevel {
  level: number;
  roles: string[];
  requiresAll: boolean;
  autoApproveAfterDays?: number;
  escalateAfterDays?: number;
  notifyUsers?: Types.ObjectId[];
}

// Year Settings interface
export interface YearSettings {
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
}

// Blackout Period interface
export interface BlackoutPeriod {
  startDate: Date;
  endDate: Date;
  reason: string;
  leaveTypes: string[];
  exceptions?: string[];
}

// Restrictions interface
export interface LeaveRestrictions {
  maximumConsecutiveDays?: number;
  minimumDaysBetweenRequests?: number;
  blackoutPeriods?: BlackoutPeriod[];
  maxStaffOnLeavePercentage?: number;
  maxStaffOnLeaveByDepartment?: Record<string, number>;
}

// Main LeavePolicy interface
export interface LeavePolicy {
  _id?: string;
  organization: Types.ObjectId | Organization;
  policyName: string;
  timezone: string;
  applicableRoles: string[];
  applicableUsers?: Types.ObjectId[];
  leaveTypes: LeaveType[];
  holidays: Holiday[];
  workSchedule: WorkSchedule;
  approvalHierarchy: ApprovalHierarchyLevel[];
  yearSettings: YearSettings;
  restrictions?: LeaveRestrictions;
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
