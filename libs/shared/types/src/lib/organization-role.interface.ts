import { Document } from 'mongoose';

export interface OrganizationRole {
  user: string | any;
  organization: string | any;
  isPrimary: boolean;
  role: string;
  permissions: string[];
  staffType: 'care' | 'admin' | 'other';
}

export interface OrganizationRoleDocument extends OrganizationRole, Document {}
