// invoice.interface.ts (to be placed in wyecare-monorepo/shared)
import { Types } from 'mongoose';

// Interface for ShiftSummaryItem
export interface ShiftSummaryItem {
  count: number;
  weekdayHours: number;
  weekendHours: number;
  holidayHours: number;
  emergencyHours: number;
  weekdayRate: number;
  weekendRate: number;
  holidayRate: number;
  emergencyRate: number;
  totalHours: number;
  totalAmount: number;
}

// Interface for HomeDetails
export interface HomeDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: Record<string, any>;
}

// Enum for Invoice Status
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partially_paid',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  INVALIDATED = 'invalidated',
}

// Main Invoice Interface
export interface Invoice {
  _id?: string;
  invoiceNumber?: string;
  homeId:
    | Types.ObjectId
    | {
        _id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
      };
  isTemporaryHome?: boolean;
  temporaryHomeId?: string;
  homeDetails?: HomeDetails;
  agencyId:
    | Types.ObjectId
    | {
        _id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
      };
  startDate: Date | string;
  endDate: Date | string;
  totalAmount: number;
  shiftSummary: Record<string, ShiftSummaryItem>;
  createdAt: Date | string;
  updatedAt?: Date | string;
  dueDate?: Date | string;
  timesheetIds?: string[];
  status: InvoiceStatus | string;
}

// Additional interfaces from RTK query
export interface IShiftSummary {
  totalHours: number;
  weekdayHours: number;
  weekendHours: number;
  holidayHours: number;
  totalAmount: number;
  weekdayAmount: number;
  weekendAmount: number;
  holidayAmount: number;
  count: number;
  averageRate: number;
}

export interface IProcessedTimesheet {
  _id: string;
  hourlyRate: number;
  hours: number;
  amount: number;
  shiftDate: string;
  shiftType: string;
  carerName: string;
  homeName: string;
  rateType: 'weekday' | 'weekend' | 'holiday';
  breakDuration?: number;
}

export interface GetInvoicesParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface IInvoiceCalculationResponse {
  timesheets: IProcessedTimesheet[];
  totalAmount: number;
  totalHours: number;
  totalTimesheets: number;
  firstShift: {
    date: string;
    type: string;
  };
  lastShift: {
    date: string;
    type: string;
  };
  summary: {
    byShiftType: { [key: string]: IShiftSummary };
    totalWeekdayHours: number;
    totalWeekendHours: number;
    totalHolidayHours: number;
    totalWeekdayAmount: number;
    totalWeekendAmount: number;
    totalHolidayAmount: number;
    averageHourlyRate: number;
  };
}

export interface ICalculateInvoiceParams {
  homeId: string;
  startDate: Date;
  endDate: Date;
}

export interface ICreateInvoiceParams {
  homeId: string;
  startDate: string;
  endDate: string;
  timesheets: IProcessedTimesheet[];
  totalAmount: number;
  shiftSummary: any;
}

export interface IUpdateInvoiceStatusParams {
  invoiceId: string;
  status: string;
}
