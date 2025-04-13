import { Address } from './address.interface';
import { Document } from 'mongoose';

export interface User {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  address?: Address;
  timezone?: string;
  gender?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  phone: string;
  countryCode: string;
  organizationRoles: string[] | any[];
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  accountDeletionRequested: boolean;
  accountDeletionRequestedAt?: Date;
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };
  fcmTokens?: string[];
}

export interface UserDocument extends User, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}
