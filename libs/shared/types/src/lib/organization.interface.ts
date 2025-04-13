import { Document } from 'mongoose';
import { Address } from './address.interface';
import { NotificationSettings } from './notification-settings.interface';

export interface Organization {
  name: string;
  type: 'agency' | 'home';
  address?: Address;
  phone?: string;
  countryCode?: string;
  email?: string;
  admin: string | any;
  parentCompany?: string | any;
  staff?: (string | any)[];
  linkedOrganizations?: (string | any)[];
  linkedTemporaryHomes?: (string | any)[];
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
  countryMetadata?: {
    code?: string;
    currency?: string;
    region?: 'IN' | 'GLOBAL';
  };
  notificationSettings?: NotificationSettings;
}

export interface OrganizationDocument extends Organization, Document {}
