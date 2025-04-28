import { Types, Document } from 'mongoose';
import { User } from './user.types';
import { IOrganization as Organization } from './organization.interface';

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

// Recurring Pattern interface
export interface RecurringPattern {
  frequency?: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  endDate?: Date;
  daysOfWeek?: number[];
  exceptions?: Date[];
}

// Time Slot interface
export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  hoursCount: number;
}

// Partial Time Details interface
export interface PartialTimeDetails {
  startTime?: Date;
  endTime?: Date;
  hoursRequested?: number;
  timeSlots?: TimeSlot[];
}

// Approval Flow Step interface
export interface ApprovalFlowStep {
  level: number;
  approver: Types.ObjectId | User;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: Date;
}

// Notifications Sent interface
export interface NotificationsSent {
  requestSubmitted?: boolean;
  requestApproved?: boolean;
  requestRejected?: boolean;
  reminderSent?: boolean;
}

// Main LeaveRequest interface
export interface LeaveRequest {
  user: Types.ObjectId | User;
  organization: Types.ObjectId | Organization;
  leaveType: string;
  status: LeaveStatus;
  startDateTime: Date;
  endDateTime: Date;
  timeUnit: LeaveTimeUnit;
  amount: number;
  reason: string;
  attachments?: string[];
  approvedBy?: Types.ObjectId | User;
  reviewedAt?: Date;
  comments?: string;
  cancellationReason?: string;
  notificationsSent: NotificationsSent;
  timezone?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  isPartialTimeUnit: boolean;
  partialTimeDetails?: PartialTimeDetails;
  approvalFlow?: ApprovalFlowStep[];
  currentApprovalLevel?: number;
  overlappingLeaves?: Types.ObjectId[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Document type that includes Mongoose document methods
export interface LeaveRequestDocument extends LeaveRequest, Document {
  // You can add any additional methods or virtual properties here
}
