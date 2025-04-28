// Types and interfaces for employee availability

import { Types } from 'mongoose';

// Enum for availability periods
export enum AvailabilityPeriod {
  DAY = 'day',
  NIGHT = 'night',
  BOTH = 'both',
}

// Single availability entry
export interface AvailabilityEntry {
  date: Date | string;
  period: AvailabilityPeriod | string;
}

// Base interface for availability
export interface AvailabilityBase {
  availabilityEntries: AvailabilityEntry[];
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  isRecurring: boolean;
}

// Create availability DTO
export interface CreateAvailabilityDto extends AvailabilityBase {
  userId?: string; // Optional if using the current user
  organizationId?: string; // May be derived from context
}

// Update availability DTO
export interface UpdateAvailabilityDto extends AvailabilityBase {
  userId?: string;
  organizationId?: string;
}

// Single date availability update
export interface SingleDateAvailabilityDto {
  date: Date | string;
  period: AvailabilityPeriod | string;
}

// Query parameters for fetching availability
export interface GetAvailabilityQueryDto {
  userId?: string;
  startDate: Date | string;
  endDate: Date | string;
}

// Query parameters for finding available employees
export interface GetAvailableEmployeesQueryDto {
  date: Date | string;
  period: AvailabilityPeriod | string;
}

// Full employee availability model as returned from API
export interface EmployeeAvailability {
  _id: string;
  user: string | Types.ObjectId;
  organization: string | Types.ObjectId;
  availabilityEntries: AvailabilityEntry[];
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  isRecurring: boolean;
  createdBy: string | Types.ObjectId;
  updatedBy: string | Types.ObjectId;
  isActive: boolean;
  isTestData?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// API response format
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Availability responses
export interface AvailabilityResponse
  extends ApiResponse<EmployeeAvailability> {}
export interface AvailabilityListResponse
  extends ApiResponse<EmployeeAvailability[]> {}

// Employee with availability information
export interface AvailableEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  availabilityPeriods: AvailabilityPeriod[];
}

// Response for available employees query
export interface AvailableEmployeesResponse
  extends ApiResponse<AvailableEmployee[]> {}
