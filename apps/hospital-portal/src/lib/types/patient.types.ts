export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: PatientAddress;
  insuranceInfo?: InsuranceInfo;
  emergencyContact?: EmergencyContact;
  assignedDoctorId?: string;
  departmentId?: string;
  organizationId: string;
  medicalRecordNumber: string;
  labRequestIds?: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  primaryInsured?: string;
  relationship?: string;
  expirationDate?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}
