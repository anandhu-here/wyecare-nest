// libs/shared/types/src/lib/shift.interface.ts
import { Schema as MongooseSchema } from 'mongoose';
import { IUser } from './user.interface';
import { IOrganization } from './organization.interface';
import { IShiftPattern } from './shift-pattern.interface';

export interface IMatchDetails {
  experienceMatch?: boolean;
  specializationMatches?: string[];
  certificationMatches?: string[];
  genderMatch?: boolean;
  isPreferred?: boolean;
}

export interface IMatchedStaff {
  user: string | MongooseSchema.Types.ObjectId | IUser;
  matchScore: number;
  matchDetails?: IMatchDetails;
}

export interface INursePreference {
  classification: 'RN' | 'EN' | 'NA';
  count: number;
}

export interface IGenderPreference {
  male: number;
  female: number;
}

export interface IRequirements {
  minExperience: number;
  specializations?: string[];
  certifications?: string[];
}

export interface IShift {
  _id: string | MongooseSchema.Types.ObjectId;
  agentId?: string | MongooseSchema.Types.ObjectId | IOrganization;
  homeId: string | MongooseSchema.Types.ObjectId | IOrganization;
  isAccepted: boolean;
  isRejected: boolean;
  isCompleted: boolean;
  isDone: boolean;
  isTemporaryHome: boolean;
  temporaryHomeId?: string | MongooseSchema.Types.ObjectId;
  count: number;
  date: string;
  assignedUsers?: IUser[];
  privateKey?: string;
  signedCarers: Record<string, any>;
  shiftPattern?: IShiftPattern;
  agencyAccepted: boolean;
  qrCodeToken?: string;
  qrCodeTokenExpiry?: Date;
  qrCodeTokenUserId?: string | MongooseSchema.Types.ObjectId | IUser;
  genderPreference: IGenderPreference;
  nursePreference: INursePreference;
  preferredStaff?: (string | MongooseSchema.Types.ObjectId | IUser)[];
  needsApproval: boolean;
  bookingStatus: 'pending' | 'approved' | 'rejected' | 'invalidated';
  requirements: IRequirements;
  emergency: boolean;
  isEmergency: boolean;
  matchedStaff: IMatchedStaff[];
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ShiftAssignmentStatus {
  ASSIGNED = 'assigned',
  CONFIRMED = 'confirmed',
  DECLINED = 'declined',
  COMPLETED = 'completed',
  SIGNED = 'signed',
}

export interface IShiftAssignment {
  _id: string | MongooseSchema.Types.ObjectId;
  shift: string | MongooseSchema.Types.ObjectId | IShift;
  user: string | MongooseSchema.Types.ObjectId | IUser;
  status: ShiftAssignmentStatus | string;
  createdAt?: Date;
  updatedAt?: Date;
}
