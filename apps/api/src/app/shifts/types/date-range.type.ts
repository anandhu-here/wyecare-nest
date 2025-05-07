// apps/api/src/app/shifts/types/date-range.type.ts
export type DateRange = {
  from: Date;
  to: Date;
};

export type WeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  SWAPPED = 'SWAPPED',
}

export enum AttendanceStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  PARTIALLY_COMPLETE = 'PARTIALLY_COMPLETE',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
}
