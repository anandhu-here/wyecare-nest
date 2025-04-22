import { Document, Schema as MongooseSchema } from 'mongoose';

// Interface for Address
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryCode?: string;
  email?: string;
}

// Interface for CountryMetadata
export interface ICountryMetadata {
  code?: string;
  currency?: string;
  region?: 'IN' | 'GLOBAL';
}

// Main User interface
export interface IUser {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isSuperAdmin: boolean;
  role: string;
  address?: IAddress;
  timezone?: string;
  gender?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  phone: string;
  countryCode: string;
  organizationRoles: MongooseSchema.Types.ObjectId[];
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  accountDeletionRequested: boolean;
  accountDeletionRequestedAt?: Date;
  countryMetadata?: ICountryMetadata;
  fcmTokens?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Document interface that extends the base interface with Mongoose Document properties
// and adds the custom methods defined in the schema
export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}
