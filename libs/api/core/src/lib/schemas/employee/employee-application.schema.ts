import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Transform } from 'class-transformer';

export type EmployeeApplicationDocument = EmployeeApplication & Document;

// Address Schema
@Schema({ _id: false })
class Address {
  @Prop({ type: String })
  street?: string;

  @Prop({ type: String })
  city?: string;

  @Prop({ type: String })
  country?: string;

  @Prop({ type: String, uppercase: true })
  zipCode?: string;

  @Prop({ type: String })
  countryCode?: string;
}

// DailyAvailability Schema
@Schema({ _id: false })
class DailyAvailability {
  @Prop({ type: Boolean })
  available?: boolean;

  @Prop({ type: Boolean })
  morning?: boolean;

  @Prop({ type: Boolean })
  afternoon?: boolean;

  @Prop({ type: Boolean })
  evening?: boolean;

  @Prop({ type: Boolean })
  night?: boolean;
}

// Availability Schema
@Schema({ _id: false })
class Availability {
  @Prop({ type: DailyAvailability, default: () => ({}) })
  monday?: DailyAvailability;

  @Prop({ type: DailyAvailability, default: () => ({}) })
  tuesday?: DailyAvailability;

  @Prop({ type: DailyAvailability, default: () => ({}) })
  wednesday?: DailyAvailability;

  @Prop({ type: DailyAvailability, default: () => ({}) })
  thursday?: DailyAvailability;

  @Prop({ type: DailyAvailability, default: () => ({}) })
  friday?: DailyAvailability;

  @Prop({ type: DailyAvailability, default: () => ({}) })
  saturday?: DailyAvailability;

  @Prop({ type: DailyAvailability, default: () => ({}) })
  sunday?: DailyAvailability;
}

// Qualification Schema
@Schema({ timestamps: true, _id: true })
class Qualification {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  level?: string;

  @Prop({ type: String })
  institution?: string;

  @Prop({ type: Date })
  dateObtained?: Date;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String })
  uploadUrl?: string;
}

// Training Schema
@Schema({ timestamps: true, _id: true })
class Training {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  provider?: string;

  @Prop({ type: Date })
  dateCompleted?: Date;

  @Prop({ type: Date })
  dateExpires?: Date;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String })
  uploadUrl?: string;
}

// Work Experience Schema
@Schema({ timestamps: true, _id: true })
class WorkExperience {
  @Prop({ type: String })
  jobTitle?: string;

  @Prop({ type: String })
  employer?: string;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: String })
  responsibilities?: string;

  @Prop({ type: String })
  reasonForLeaving?: string;

  @Prop({ type: String })
  uploadUrl?: string;
}

// Reference Schema
@Schema({ timestamps: true, _id: true })
class Reference {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  position?: string;

  @Prop({ type: String })
  company?: string;

  @Prop({ type: String })
  relationship?: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  phone?: string;

  @Prop({ type: String })
  uploadUrl?: string;
}

// Vaccination Status Schema
@Schema({ _id: false })
class VaccinationStatus {
  @Prop({ type: Boolean })
  tetanus?: boolean;

  @Prop({ type: Date })
  tetanusDate?: Date;

  @Prop({ type: Boolean })
  covid19?: boolean;

  @Prop({ type: Date })
  covid19Date?: Date;

  @Prop({ type: Boolean })
  fluShot?: boolean;

  @Prop({ type: Date })
  fluShotDate?: Date;
}

// Health Declaration Schema
@Schema({ _id: false })
class HealthDeclaration {
  @Prop({ type: Boolean })
  hasHealthConditions?: boolean;

  @Prop({ type: String })
  healthConditionsDetails?: string;

  @Prop({ type: Boolean })
  requiresAdjustments?: boolean;

  @Prop({ type: String })
  adjustmentsDetails?: string;

  @Prop({ type: VaccinationStatus, default: () => ({}) })
  vaccinationStatus?: VaccinationStatus;
}

// Emergency Contact Schema
@Schema({ _id: false })
class EmergencyContact {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  relationship?: string;

  @Prop({ type: String })
  phone?: string;
}

// Identification Document Schema
@Schema({ _id: false })
class IdentificationDocument {
  @Prop({ type: String })
  number?: string;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String })
  frontUploadUrl?: string;

  @Prop({ type: String })
  backUploadUrl?: string;
}

// Professional Registration Schema
@Schema({ _id: true })
class ProfessionalRegistration {
  @Prop({ type: String, enum: ['NMC', 'HCPC', 'Other'] })
  type?: string;

  @Prop({ type: String })
  registrationNumber?: string;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String })
  uploadUrl?: string;
}

// DBS Check Schema
@Schema({ _id: false })
class DBSCheck {
  @Prop({ type: String })
  certificateNumber?: string;

  @Prop({ type: Date })
  issueDate?: Date;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({
    type: String,
    enum: ['Standard', 'Enhanced', 'Basic'],
    default: 'Standard',
  })
  type?: string;

  @Prop({
    type: String,
    enum: ['Clear', 'Not Clear', 'Pending', 'Not Applicable'],
  })
  status?: string;

  @Prop({ type: String })
  uploadUrl?: string;
}

// Language Schema
@Schema({ _id: true })
class Language {
  @Prop({ type: String })
  language?: string;

  @Prop({
    type: String,
    enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
  })
  proficiency?: string;
}

// Care Skill Schema
@Schema({ _id: true })
class CareSkill {
  @Prop({ type: String })
  skill?: string;

  @Prop({
    type: String,
    enum: ['Novice', 'Intermediate', 'Expert'],
  })
  experienceLevel?: string;
}

// Personal Info Schema
@Schema({ _id: false })
class PersonalInfo {
  @Prop({ type: String })
  summary?: string;

  @Prop({ type: String, enum: ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Other'] })
  title?: string;

  @Prop({ type: String })
  jobTitle?: string;

  @Prop({ type: String, trim: true })
  firstName?: string;

  @Prop({ type: String })
  avatarUrl?: string;

  @Prop({ type: String, trim: true })
  lastName?: string;

  @Prop({ type: String, trim: true })
  middleName?: string;

  @Prop({ type: String, trim: true })
  preferredName?: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({
    type: String,
    enum: ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'],
  })
  gender?: string;

  @Prop({
    type: String,
    uppercase: true,
  })
  nationalInsuranceNumber?: string;

  @Prop({ type: Address })
  address?: Address;

  @Prop({ type: String })
  phone?: string;

  @Prop({
    type: String,
    lowercase: true,
    transform: (value: string) => value?.trim().toLowerCase(),
  })
  email?: string;

  @Prop({ type: EmergencyContact })
  emergencyContact?: EmergencyContact;
}

// Identification Documents Schema
@Schema({ _id: false })
class IdentificationDocuments {
  @Prop({ type: IdentificationDocument })
  passport?: IdentificationDocument;

  @Prop({ type: IdentificationDocument })
  drivingLicense?: IdentificationDocument;

  @Prop({ type: IdentificationDocument })
  biometricResidencePermit?: IdentificationDocument;

  @Prop({
    type: String,
    enum: ['UK Citizen', 'EU Settled Status', 'Visa Required'],
  })
  rightToWorkStatus?: string;

  @Prop({ type: String })
  rightToWorkProofUrl?: string;
}

// Professional Info Schema
@Schema({ _id: false })
class ProfessionalInfo {
  @Prop({ type: [Qualification], default: [] })
  qualifications?: Qualification[];

  @Prop({ type: [Training], default: [] })
  trainings?: Training[];

  @Prop({ type: [WorkExperience], default: [] })
  workExperience?: WorkExperience[];

  @Prop({ type: [Reference], default: [] })
  references?: Reference[];

  @Prop({ type: DBSCheck })
  dbsCheck?: DBSCheck;

  @Prop({ type: [ProfessionalRegistration], default: [] })
  professionalRegistrations?: ProfessionalRegistration[];
}

// Skills Schema
@Schema({ _id: false })
class Skills {
  @Prop({ type: [Language], default: [] })
  languages?: Language[];

  @Prop({ type: [CareSkill], default: [] })
  careSkills?: CareSkill[];

  @Prop({ type: [String], default: [] })
  specializations?: string[];
}

// Work Pattern Schema
@Schema({ _id: false })
class WorkPatternDetails {
  @Prop({
    type: String,
    enum: ['Full-time', 'Part-time', 'Flexible'],
  })
  preferredWorkPattern?: string;

  @Prop({ type: Availability })
  availabilityDetails?: Availability;

  @Prop({ type: Number, min: 0, max: 168 })
  maxHoursPerWeek?: number;

  @Prop({ type: Number, min: 0, max: 168 })
  minHoursPerWeek?: number;
}

// Health And Safety Schema
@Schema({ _id: false })
class HealthAndSafety {
  @Prop({ type: HealthDeclaration })
  healthDeclaration?: HealthDeclaration;

  @Prop({
    type: {
      completed: Boolean,
      completionDate: Date,
    },
  })
  manualHandlingTraining?: {
    completed?: boolean;
    completionDate?: Date;
  };

  @Prop({
    type: {
      held: Boolean,
      expiryDate: Date,
    },
  })
  foodHygieneCertificate?: {
    held?: boolean;
    expiryDate?: Date;
  };
}

// Bank Details Schema
@Schema({ _id: false })
class BankDetails {
  @Prop({ type: String })
  accountHolderName?: string;

  @Prop({ type: String })
  bankName?: string;

  @Prop({ type: String })
  accountNumber?: string;

  @Prop({ type: String })
  sortCode?: string;
}

// Additional Info Schema
@Schema({ _id: false })
class AdditionalInfo {
  @Prop({ type: Boolean })
  hasTransport?: boolean;

  @Prop({ type: Boolean })
  willingToTravel?: boolean;

  @Prop({ type: Number })
  maxTravelDistance?: number;

  @Prop({ type: String })
  additionalNotes?: string;
}

// Status Change Log Schema
@Schema({ _id: true })
class StatusChangeLog {
  @Prop({ type: String })
  status?: string;

  @Prop({ type: Date })
  changedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  changedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  reason?: string;
}

// Application Status Schema
@Schema({ _id: false })
class ApplicationStatus {
  @Prop({
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
    default: 'Draft',
  })
  status?: string;

  @Prop({ type: Date })
  submissionDate?: Date;

  @Prop({ type: Date })
  reviewDate?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reviewedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: [StatusChangeLog], default: [] })
  statusChangeLog?: StatusChangeLog[];
}

// Consents Schema
@Schema({ _id: false })
class Consents {
  @Prop({ type: Boolean })
  dataProcessing?: boolean;

  @Prop({ type: Boolean })
  backgroundCheck?: boolean;

  @Prop({ type: Boolean })
  termsAndConditions?: boolean;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'EmployeeApplications',
})
export class EmployeeApplication {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    unique: true,
  })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: PersonalInfo })
  personalInfo!: PersonalInfo;

  @Prop({ type: IdentificationDocuments })
  identificationDocuments!: IdentificationDocuments;

  @Prop({ type: ProfessionalInfo })
  professionalInfo!: ProfessionalInfo;

  @Prop({ type: Skills })
  skills!: Skills;

  @Prop({ type: String, enum: ['Full-time', 'Part-time', 'Flexible'] })
  workPattern?: string;

  @Prop({ type: WorkPatternDetails })
  availability!: WorkPatternDetails;

  @Prop({ type: HealthAndSafety })
  healthAndSafety!: HealthAndSafety;

  @Prop({ type: BankDetails })
  bankDetails!: BankDetails;

  @Prop({ type: AdditionalInfo })
  additionalInfo!: AdditionalInfo;

  @Prop({ type: ApplicationStatus, default: () => ({}) })
  applicationStatus!: ApplicationStatus;

  @Prop({ type: Consents })
  consents!: Consents;
}

export const EmployeeApplicationSchema =
  SchemaFactory.createForClass(EmployeeApplication);

// Add virtual properties
EmployeeApplicationSchema.virtual('fullName').get(function (
  this: EmployeeApplicationDocument
) {
  return `${this.personalInfo?.firstName || ''} ${
    this.personalInfo?.lastName || ''
  }`;
});

// Add pre-save hooks
EmployeeApplicationSchema.pre(
  'save',
  function (this: EmployeeApplicationDocument, next) {
    // Set submission date when status changes to Submitted
    if (
      this.isModified('applicationStatus.status') &&
      this.applicationStatus?.status === 'Submitted'
    ) {
      this.applicationStatus.submissionDate = new Date();
    }
    next();
  }
);

// Add methods
// Add methods
EmployeeApplicationSchema.methods['isApplicationComplete'] = function (
  this: EmployeeApplicationDocument
): boolean {
  return !!(
    this.personalInfo?.firstName &&
    this.personalInfo?.lastName &&
    this.personalInfo?.dateOfBirth &&
    this.personalInfo?.nationalInsuranceNumber &&
    this.personalInfo?.address &&
    this.personalInfo?.phone &&
    this.personalInfo?.email &&
    this.identificationDocuments?.rightToWorkStatus &&
    this.bankDetails?.accountHolderName &&
    this.bankDetails?.bankName &&
    this.bankDetails?.accountNumber &&
    this.bankDetails?.sortCode &&
    this.consents?.dataProcessing &&
    this.consents?.backgroundCheck &&
    this.consents?.termsAndConditions
  );
};

// Add static methods
// Add static methods
EmployeeApplicationSchema.statics['findByUserId'] = function (userId: string) {
  return this.findOne({ userId });
};

// Add indexes
EmployeeApplicationSchema.index({ userId: 1 }, { unique: true });
EmployeeApplicationSchema.index(
  { 'personalInfo.email': 1 },
  { sparse: true, unique: true }
);
EmployeeApplicationSchema.index(
  { 'personalInfo.nationalInsuranceNumber': 1 },
  { sparse: true, unique: true }
);
EmployeeApplicationSchema.index({
  'personalInfo.firstName': 1,
  'personalInfo.lastName': 1,
});
EmployeeApplicationSchema.index({ 'applicationStatus.status': 1 });
EmployeeApplicationSchema.index({ createdAt: -1 });
EmployeeApplicationSchema.index({
  'professionalInfo.qualifications.expiryDate': 1,
});
EmployeeApplicationSchema.index({ 'professionalInfo.trainings.expiryDate': 1 });
EmployeeApplicationSchema.index({ 'professionalInfo.dbsCheck.status': 1 });
EmployeeApplicationSchema.index({ 'skills.careSkills.skill': 1 });
EmployeeApplicationSchema.index({ 'availability.preferredWorkPattern': 1 });

// Compound indexes
EmployeeApplicationSchema.index({ userId: 1, 'applicationStatus.status': 1 });
EmployeeApplicationSchema.index({
  'personalInfo.firstName': 1,
  'personalInfo.lastName': 1,
  'applicationStatus.status': 1,
});
