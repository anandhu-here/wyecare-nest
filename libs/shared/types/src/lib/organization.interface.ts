import { Document, Schema as MongooseSchema } from 'mongoose';
import { IAddress, ICountryMetadata } from './user.interface';
export interface INotificationProviderTemplate {
  title?: string;
  body?: string;
  active: boolean;
  subject?: string;
}
export interface ISmsProvider {
  enabled: boolean;
  fromNumber?: string;
  templates?: Record<string, any>;
}
export interface IPushProvider {
  enabled: boolean;
  templates?: Record<string, any>;
}
export interface IEmailProvider {
  enabled: boolean;
  fromEmail?: string;
  templates?: Record<string, any>;
}
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
export interface IOrganization {
  status?: string;
  name: string;
  type?: 'agency' | 'home' | 'other';
  category:
    | 'hospital'
    | 'staff_provider'
    | 'software_company'
    | 'manufacturing'
    | 'education'
    | 'retail'
    | 'logistics'
    | 'construction'
    | 'financial'
    | 'hospitality'
    | 'healthcare'
    | 'care_home'
    | 'social_services'
    | 'service_provider'
    | 'other';
  subCategory?: string;
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
export interface IOrganizationDocument extends IOrganization, Document {}
