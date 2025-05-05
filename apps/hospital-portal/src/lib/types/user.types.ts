export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  departmentId?: string;
  roles?: Role[];
  permissions?: Permission[];
  assignedPatients?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  permissions: Permission[];
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id?: string;
  action: string;
  subject: string;
  conditions?: Record<string, any>;
  fields?: string[];
  inverted?: boolean;
  reason?: string;
}
