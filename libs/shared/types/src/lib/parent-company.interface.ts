import { Document } from 'mongoose';
import { Address } from './address.interface';

export interface ParentCompany {
  name: string;
  address?: Address;
  phone: string;
  email: string;
  organizations?: (string | any)[];
}

export interface ParentCompanyDocument extends ParentCompany, Document {}
