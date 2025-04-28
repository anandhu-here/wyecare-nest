import { Document, Types } from 'mongoose';
import { User } from './user.types';
import { IShift } from './shift.interface';
import { IOrganization } from './organization.interface';
import { Invoice, InvoiceStatus } from './invoice.interface';

export enum TimesheetStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INVALIDATED = 'invalidated',
}

export enum RequestType {
  MANUAL = 'manual',
  AUTO = 'auto',
}

export enum SignerRole {
  NURSE = 'nurse',
  SENIOR_CARER = 'senior carer',
  MANAGER = 'manager',
}

/**
 * Interface for the Signature embedded document
 */
export interface Signature {
  storageRef?: string;
  downloadUrl?: string;
  timestamp?: Date;
  ipAddress?: string;
  deviceInfo?: string;
  verified: boolean;
  signerName?: string;
  signerRole?: SignerRole;
}

/**
 * Main Timesheet interface
 */
export interface Timesheet {
  _id?: string | Types.ObjectId;
  shiftId: Types.ObjectId | IShift;
  carer: Types.ObjectId | User;
  home: Types.ObjectId | IOrganization;
  agency?: Types.ObjectId | IOrganization;
  status: TimesheetStatus;
  invoiceStatus?: InvoiceStatus;
  invoiceId?: Types.ObjectId | Invoice;
  invoicedAt?: Date;
  invoiceNumber?: string;
  paidAt?: Date;
  paymentReference?: string;
  rating?: number;
  review?: string;
  requestType?: RequestType;
  documentUrl?: string;
  approvedBy?: Types.ObjectId | User;
  tokenForQrCode?: string;
  signature?: Signature;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for creating a new timesheet
 */
export interface CreateTimesheetDto {
  shiftId: string;
  carer: string;
  home: string;
  agency?: string;
  status?: TimesheetStatus;
  invoiceStatus?: InvoiceStatus;
  requestType?: RequestType;
  documentUrl?: string;
  tokenForQrCode?: string;
  signature?: Signature;
}

/**
 * Interface for updating a timesheet
 */
export interface UpdateTimesheetDto {
  status?: TimesheetStatus;
  invoiceStatus?: InvoiceStatus;
  invoiceId?: string;
  invoiceNumber?: string;
  rating?: number;
  review?: string;
  approvedBy?: string;
  paymentReference?: string;
  signature?: Signature;
}

/**
 * Interface for timesheet query filters
 */
export interface TimesheetQueryFilters {
  status?: TimesheetStatus | TimesheetStatus[];
  invoiceStatus?: InvoiceStatus | InvoiceStatus[];
  carer?: string;
  home?: string;
  agency?: string;
  startDate?: Date;
  endDate?: Date;
  invoiceId?: string;
  shiftId?: string;
}
