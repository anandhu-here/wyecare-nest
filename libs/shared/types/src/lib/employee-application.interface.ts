// src/types/employeeApplication.interface.ts
import { Types } from 'mongoose';
import { Address } from './address.interface';

export interface DailyAvailability {
  available?: boolean;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  night?: boolean;
}

export interface Availability {
  monday?: DailyAvailability;
  tuesday?: DailyAvailability;
  wednesday?: DailyAvailability;
  thursday?: DailyAvailability;
  friday?: DailyAvailability;
  saturday?: DailyAvailability;
  sunday?: DailyAvailability;
}

export interface Qualification {
  _id?: string;
  name?: string;
  level?: string;
  institution?: string;
  dateObtained?: Date;
  expiryDate?: Date;
  uploadUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Training {
  _id?: string;
  name?: string;
  provider?: string;
  dateCompleted?: Date;
  dateExpires?: Date;
  expiryDate?: Date;
  uploadUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkExperience {
  _id?: string;
  jobTitle?: string;
  employer?: string;
  startDate?: Date;
  endDate?: Date;
  responsibilities?: string;
  reasonForLeaving?: string;
  uploadUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Reference {
  _id?: string;
  name?: string;
  position?: string;
  company?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  uploadUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VaccinationStatus {
  tetanus?: boolean;
  tetanusDate?: Date;
  covid19?: boolean;
  covid19Date?: Date;
  fluShot?: boolean;
  fluShotDate?: Date;
}

export interface HealthDeclaration {
  hasHealthConditions?: boolean;
  healthConditionsDetails?: string;
  requiresAdjustments?: boolean;
  adjustmentsDetails?: string;
  vaccinationStatus?: VaccinationStatus;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface IdentificationDocument {
  number?: string;
  expiryDate?: Date;
  frontUploadUrl?: string;
  backUploadUrl?: string;
}

export interface ProfessionalRegistration {
  _id?: string;
  type?: 'NMC' | 'HCPC' | 'Other';
  registrationNumber?: string;
  expiryDate?: Date;
  uploadUrl?: string;
}

export interface DBSCheck {
  certificateNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  type?: 'Standard' | 'Enhanced' | 'Basic';
  status?: 'Clear' | 'Not Clear' | 'Pending' | 'Not Applicable';
  uploadUrl?: string;
}

export interface Language {
  _id?: string;
  language?: string;
  proficiency?: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface CareSkill {
  _id?: string;
  skill?: string;
  experienceLevel?: 'Novice' | 'Intermediate' | 'Expert';
}

export interface PersonalInfo {
  summary?: string;
  title?: 'Mr' | 'Mrs' | 'Miss' | 'Ms' | 'Dr' | 'Other';
  jobTitle?: string;
  firstName?: string;
  avatarUrl?: string;
  lastName?: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Non-binary' | 'Other' | 'Prefer not to say';
  nationalInsuranceNumber?: string;
  address?: Address;
  phone?: string;
  email?: string;
  emergencyContact?: EmergencyContact;
}

export interface IdentificationDocuments {
  passport?: IdentificationDocument;
  drivingLicense?: IdentificationDocument;
  biometricResidencePermit?: IdentificationDocument;
  rightToWorkStatus?: 'UK Citizen' | 'EU Settled Status' | 'Visa Required';
  rightToWorkProofUrl?: string;
}

export interface ProfessionalInfo {
  qualifications?: Qualification[];
  trainings?: Training[];
  workExperience?: WorkExperience[];
  references?: Reference[];
  dbsCheck?: DBSCheck;
  professionalRegistrations?: ProfessionalRegistration[];
}

export interface Skills {
  languages?: Language[];
  careSkills?: CareSkill[];
  specializations?: string[];
}

export interface WorkPatternDetails {
  preferredWorkPattern?: 'Full-time' | 'Part-time' | 'Flexible';
  availabilityDetails?: Availability;
  maxHoursPerWeek?: number;
  minHoursPerWeek?: number;
}

export interface HealthAndSafety {
  healthDeclaration?: HealthDeclaration;
  manualHandlingTraining?: {
    completed?: boolean;
    completionDate?: Date;
  };
  foodHygieneCertificate?: {
    held?: boolean;
    expiryDate?: Date;
  };
}

export interface BankDetails {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  sortCode?: string;
}

export interface AdditionalInfo {
  hasTransport?: boolean;
  willingToTravel?: boolean;
  maxTravelDistance?: number;
  additionalNotes?: string;
}

export interface StatusChangeLog {
  _id?: string;
  status?: string;
  changedAt?: Date;
  changedBy?: Types.ObjectId;
  reason?: string;
}

export interface ApplicationStatus {
  status?: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  submissionDate?: Date;
  reviewDate?: Date;
  reviewedBy?: Types.ObjectId;
  statusChangeLog?: StatusChangeLog[];
}

export interface Consents {
  dataProcessing?: boolean;
  backgroundCheck?: boolean;
  termsAndConditions?: boolean;
}

export interface IEmployeeApplication {
  _id?: string;
  userId?: Types.ObjectId;
  personalInfo: PersonalInfo;
  identificationDocuments: IdentificationDocuments;
  professionalInfo: ProfessionalInfo;
  skills: Skills;
  workPattern?: 'Full-time' | 'Part-time' | 'Flexible';
  availability: WorkPatternDetails;
  healthAndSafety: HealthAndSafety;
  bankDetails: BankDetails;
  additionalInfo: AdditionalInfo;
  applicationStatus: ApplicationStatus;
  consents: Consents;
  fullName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Request and Response interfaces for API calls
export interface CreateEmployeeApplicationRequest {
  personalInfo?: Partial<PersonalInfo>;
  identificationDocuments?: Partial<IdentificationDocuments>;
  professionalInfo?: Partial<ProfessionalInfo>;
  skills?: Partial<Skills>;
  workPattern?: 'Full-time' | 'Part-time' | 'Flexible';
  availability?: Partial<WorkPatternDetails>;
  healthAndSafety?: Partial<HealthAndSafety>;
  bankDetails?: Partial<BankDetails>;
  additionalInfo?: Partial<AdditionalInfo>;
  consents?: Partial<Consents>;
}

export interface UpdateEmployeeApplicationRequest {
  _id: string;
  personalInfo?: Partial<PersonalInfo>;
  identificationDocuments?: Partial<IdentificationDocuments>;
  professionalInfo?: Partial<ProfessionalInfo>;
  skills?: Partial<Skills>;
  workPattern?: 'Full-time' | 'Part-time' | 'Flexible';
  availability?: Partial<WorkPatternDetails>;
  healthAndSafety?: Partial<HealthAndSafety>;
  bankDetails?: Partial<BankDetails>;
  additionalInfo?: Partial<AdditionalInfo>;
  consents?: Partial<Consents>;
  applicationStatus?: Partial<ApplicationStatus>;
}

export interface SubmitEmployeeApplicationRequest {
  _id: string;
}

export interface GetEmployeeApplicationsResponse {
  applications: IEmployeeApplication[];
  total: number;
  page: number;
  limit: number;
}

export interface GetEmployeeApplicationByIdResponse {
  application: IEmployeeApplication;
}

export interface UpdateApplicationStatusRequest {
  _id: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  reason?: string;
}

export interface AddQualificationRequest {
  applicationId: string;
  qualification: Omit<Qualification, '_id'>;
}

export interface UpdateQualificationRequest {
  applicationId: string;
  qualificationId: string;
  qualification: Partial<Qualification>;
}

export interface AddTrainingRequest {
  applicationId: string;
  training: Omit<Training, '_id'>;
}

export interface UpdateTrainingRequest {
  applicationId: string;
  trainingId: string;
  training: Partial<Training>;
}

export interface AddWorkExperienceRequest {
  applicationId: string;
  workExperience: Omit<WorkExperience, '_id'>;
}

export interface UpdateWorkExperienceRequest {
  applicationId: string;
  workExperienceId: string;
  workExperience: Partial<WorkExperience>;
}

export interface AddReferenceRequest {
  applicationId: string;
  reference: Omit<Reference, '_id'>;
}

export interface UpdateReferenceRequest {
  applicationId: string;
  referenceId: string;
  reference: Partial<Reference>;
}

export interface AddLanguageRequest {
  applicationId: string;
  language: Omit<Language, '_id'>;
}

export interface UpdateLanguageRequest {
  applicationId: string;
  languageId: string;
  language: Partial<Language>;
}

export interface AddCareSkillRequest {
  applicationId: string;
  careSkill: Omit<CareSkill, '_id'>;
}

export interface UpdateCareSkillRequest {
  applicationId: string;
  careSkillId: string;
  careSkill: Partial<CareSkill>;
}
