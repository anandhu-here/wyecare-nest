import { Document, Types } from 'mongoose';
import { User } from './user.types';
import { IOrganization } from './organization.interface';

export enum AttendanceStatus {
  SIGNED_IN = 'signedIn',
  SIGNED_OUT = 'signedOut',
  ABSENT = 'absent',
  LATE = 'late',
  PENDING = 'pending',
}

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
  address?: string;
}

export interface AttendanceMetadata {
  deviceId?: string;
  location?: AttendanceLocation;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
}

export interface QRCodePayload {
  workplaceId: string;
  type: 'IN' | 'OUT';
  expiresAt: Date;
  timestamp: Date;
}

/**
 * Main Attendance interface
 */
export interface Attendance {
  _id?: string | Types.ObjectId;
  user: Types.ObjectId | User;
  workplace: Types.ObjectId | IOrganization;
  agency?: Types.ObjectId | IOrganization;
  date: Date;
  signInTime?: Date;
  signOutTime?: Date;
  status: AttendanceStatus;
  duration?: number; // in minutes
  signInMetadata?: AttendanceMetadata;
  signOutMetadata?: AttendanceMetadata;
  qrCode?: string;
  timezone: string;
  manuallyUpdated?: boolean;
  updateReason?: string;
  updatedBy?: Types.ObjectId | User;
  shift?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GenerateQRCodeDto {
  workplaceId: string;
  type: 'IN' | 'OUT';
  expiresInMinutes?: number;
}

/**
 * Interface for clock in data
 */
export interface ClockInData {
  userId: string;
  workplaceId: string;
  timezone: string;
  metadata: AttendanceMetadata;
}

/**
 * Interface for clock out data
 */
export interface ClockOutData {
  userId: string;
  workplaceId: string;
  timezone: string;
  metadata: AttendanceMetadata;
}

/**
 * Interface for querying attendance registry
 */
export interface AttendanceRegistryQuery {
  workplaceId: string;
  startDate: Date;
  endDate: Date;
  staffType?: string;
  agencyId?: string;
  page?: number;
  limit?: number;
}

/**
 * Interface for manual attendance updates
 */
export interface ManualAttendanceUpdate {
  attendanceId: string;
  signInTime?: string | Date;
  signOutTime?: string | Date;
  status?: AttendanceStatus;
  reason: string;
  adminUser: any;
  currentOrganization: any;
}

/**
 * Interface for workplace attendance summary
 */
export interface WorkplaceAttendanceSummary {
  date: Date;
  workplace: any;
  totalUsers: number;
  present: number;
  absent: number;
  late: number;
  shifts: any[];
  attendanceRecords: Attendance[];
}
