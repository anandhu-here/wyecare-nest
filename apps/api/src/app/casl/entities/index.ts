// apps/api/src/app/casl/entities/index.ts

import { Invitation } from '@prisma/client';

export class Organization {
  id: string;
  category: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  websiteUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Department {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  organizationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Permission {
  id: string;
  action: string;
  subject: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  medicalRecordNumber: string;
  gender?: string;
  contactPhone?: string;
  contactEmail?: string;
  organizationId: string;
  departmentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MedicalRecord {
  id: string;
  patientId: string;
  type: string;
  content: any;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Appointment {
  id: string;
  patientId: string;
  departmentId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ShiftType {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  isOvernight: boolean;
  hoursCount: number;
  basePayMultiplier: number;
  description?: string;
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StaffProfile {
  id: string;
  userId: string;
  staffType: string;
  specialty?: string;
  experienceYears: number;
  educationLevel?: string;
  certifications?: any;
  baseSalaryType: string;
  baseSalaryAmount: number;
  dateJoined: Date;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ShiftSchedule {
  id: string;
  staffProfileId: string;
  shiftTypeId: string;
  departmentId: string;
  startDateTime: Date;
  endDateTime: Date;
  status: string;
  isConfirmed: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ShiftAttendance {
  id: string;
  shiftScheduleId: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: string;
  overtimeMinutes: number;
  approvedById?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PayPeriod {
  id: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StaffPayment {
  id: string;
  staffProfileId: string;
  payPeriodId: string;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  specialtyBonus: number;
  otherBonuses: number;
  deductions: number;
  totalPay: number;
  paymentStatus: string;
  paymentDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InvitationClass implements Invitation {
  id: string;
  email: string;
  token: string;
  status: string;
  organizationId: string | null;
  roleId: string | null;
  message: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  createdById: string;
  acceptedAt: Date | null;
  acceptedById: string | null;
  revokedAt: Date | null;
  revokedById: string | null;
}
