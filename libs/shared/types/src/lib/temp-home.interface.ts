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
