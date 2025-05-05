export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  organizationId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'CheckedIn'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';

export type AppointmentType =
  | 'NewPatient'
  | 'FollowUp'
  | 'Consultation'
  | 'Procedure'
  | 'LabWork'
  | 'Imaging'
  | 'Physical'
  | 'Emergency';
