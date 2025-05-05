export interface Organization {
  id: string;
  name: string;
  type: string;
  address?: Address;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  settings?: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
  managerId?: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrganizationSettings {
  theme?: string;
  logo?: string;
  allowPatientPortal?: boolean;
  enableTwoFactorAuth?: boolean;
  defaultLanguage?: string;
  timeZone?: string;
  dateFormat?: string;
  timeFormat?: string;
}
