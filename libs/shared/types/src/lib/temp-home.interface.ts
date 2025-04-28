import { Types } from 'mongoose';

export interface ITemporaryHomeResponse {
  _id: string;
  name: string;
  createdByAgency: string;
  temporaryId: string;
  isClaimed: boolean;
  claimedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemporaryHomeStats {
  shifts: number;
  residents: number;
  staff: number;
  documents: number;
}

export interface ITemporaryHomeVerification {
  exists: boolean;
  isClaimed: boolean;
  name?: string;
  createdByAgency?: string;
  createdAt?: Date;
}

// Define the types for request and response data
export interface TemporaryHome {
  _id: string;
  name: string;
  createdByAgency: string;
  temporaryId: string;
  isClaimed: boolean;
  claimedBy?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemporaryHomeRequest {
  name: string;
}

export interface UpdateTemporaryHomeRequest {
  tempHomeId: string;
  name?: string;
  metadata?: any;
}

export interface ClaimTemporaryHomeRequest {
  temporaryId: string;
}

export interface TemporaryHomeStatsResponse {
  tempHome: TemporaryHome;
  stats: {
    shifts: number;
    timesheets: number;
    invoices: number;
  };
}

export interface VerifyTemporaryIdResponse {
  isValid: boolean;
  tempHome?: TemporaryHome;
  agency?: any;
}
