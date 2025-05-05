export * from './user.types';
export * from './organization.types';
export * from './patient.types';
export * from './medical-records.types';
export * from './appointment.types';

// Additional types we might need

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'Pending' | 'Accepted' | 'Expired';
  organizationId: string;
  invitedById: string;
  expiration: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
  };
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface Billing {
  id: string;
  patientId: string;
  appointmentId?: string;
  procedureId?: string;
  organizationId: string;
  amount: number;
  description: string;
  status: 'Draft' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  dueDate?: string;
  paidDate?: string;
  paidAmount?: number;
  insurance?: {
    provider: string;
    policyNumber: string;
    claimNumber?: string;
    status?: string;
    submissionDate?: string;
  };
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  description?: string;
  parameters?: Record<string, any>;
  createdById: string;
  organizationId: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}
