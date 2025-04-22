import { Document, Schema as MongooseSchema } from 'mongoose';
import { IAddress, ICountryMetadata } from './user.interface';

// Interface for NotificationProviderTemplate
export interface INotificationProviderTemplate {
  title?: string;
  body?: string;
  active: boolean;
  subject?: string;
}

// Interface for SmsProvider
export interface ISmsProvider {
  enabled: boolean;
  fromNumber?: string;
  templates?: Record<string, any>;
}

// Interface for PushProvider
export interface IPushProvider {
  enabled: boolean;
  templates?: Record<string, any>;
}

// Interface for EmailProvider
export interface IEmailProvider {
  enabled: boolean;
  fromEmail?: string;
  templates?: Record<string, any>;
}

// Interface for NotificationSettings
export interface INotificationSettings {
  sms: {
    enabled: boolean;
    providers: {
      twilio: any;
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };
  push: {
    enabled: boolean;
    providers: {
      fcm: any;
    };
    quotaExceededAction: 'stop' | 'notify' | 'continue';
  };
  email: {
    enabled: boolean;
    providers: {
      smtp: any;
    };
  };
}

// Main Organization interface
export interface IOrganization {
  status?: string;
  name: string;
  type: 'agency' | 'home';
  address?: IAddress;
  phone?: string;
  countryCode?: string;
  email?: string;
  admin: MongooseSchema.Types.ObjectId;
  parentCompany?: MongooseSchema.Types.ObjectId;
  staff?: MongooseSchema.Types.ObjectId[];
  linkedOrganizations?: MongooseSchema.Types.ObjectId[];
  linkedTemporaryHomes?: MongooseSchema.Types.ObjectId[];
  avatarUrl?: string;
  logoUrl?: string;
  staffsRange?: string;
  residentsRange?: string;
  residentManagementEnabled?: boolean;
  features?: string[];
  maxLinkedOrganizations?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
  websiteUrl?: string;
  countryMetadata?: ICountryMetadata;
  notificationSettings?: INotificationSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

// Document interface that extends the base interface with Mongoose Document properties
export interface IOrganizationDocument extends IOrganization, Document {}
