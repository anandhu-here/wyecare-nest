import { Types } from 'mongoose';
import { LeaveTimeUnit } from './leave-request.interface';
import { User } from './user.types';
import { IOrganization } from './organization.interface';

// Accrual frequency type
type AccrualFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'biweekly';

// Accrual information interface
export interface LeaveAccrual {
  frequency: AccrualFrequency;
  rate: number;
  timeUnit: LeaveTimeUnit;
  maxAccumulation?: number;
  lastAccrualDate?: Date;
}

// Adjustment entry interface
export interface LeaveAdjustment {
  date: Date;
  amount: number;
  timeUnit: LeaveTimeUnit;
  reason: string;
  authorizedBy?: Types.ObjectId | User;
}

// Time unit allocations interface
export interface TimeUnitAllocations {
  [LeaveTimeUnit.HOURS]?: number;
  [LeaveTimeUnit.DAYS]?: number;
  [LeaveTimeUnit.WEEKS]?: number;
}

// Leave type balance interface
export interface LeaveTypeBalance {
  allocations: TimeUnitAllocations;
  used: TimeUnitAllocations;
  pending: TimeUnitAllocations;
  accrual?: LeaveAccrual;
  adjustments?: LeaveAdjustment[];
}

// Additional entitlement interface
export interface AdditionalEntitlement {
  leaveType: string;
  amount: number;
  timeUnit: LeaveTimeUnit;
  expiryDate: Date;
  source?: string;
  notes?: string;
}

// Main LeaveBalance interface
export interface LeaveBalance {
  _id?: string;
  user: Types.ObjectId | User;
  organization: Types.ObjectId | IOrganization;
  year: number;
  balances: {
    [leaveType: string]: LeaveTypeBalance;
  };
  additionalEntitlements?: AdditionalEntitlement[];
  timezone?: string;
  lastUpdated: Date;
  lastCalculated?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Document type that includes Mongoose document methods
export interface LeaveBalanceDocument extends LeaveBalance, Document {
  // You can add any additional methods or virtual properties here
}
