export interface MedicalRecord {
  id: string;
  patientId: string;
  type: MedicalRecordType;
  date: string;
  providerId: string;
  departmentId: string;
  organizationId: string;
  summary: string;
  detailedNotes?: string;
  attachments?: Attachment[];
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MedicalRecordType =
  | 'VitalSigns'
  | 'Medication'
  | 'Nursing'
  | 'Diagnosis'
  | 'LabOrder'
  | 'LabResults'
  | 'Confidential'
  | 'Billing'
  | 'Insurance';

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  orderId: string;
  testName: string;
  testDate: string;
  resultDate: string;
  technicianId: string;
  departmentId: string;
  organizationId: string;
  results: LabTestResult[];
  notes?: string;
  status: LabResultStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LabTestResult {
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  notes?: string;
}

export type LabResultStatus =
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Verified';
