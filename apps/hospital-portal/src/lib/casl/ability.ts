import {
  PureAbility,
  AbilityBuilder,
  AbilityClass,
  subject,
  ForbiddenError,
  createMongoAbility,
} from '@casl/ability';
import {
  User,
  Role,
  Organization,
  Invitation,
  Patient,
  Appointment,
  MedicalRecord,
} from '../types';

// Define subject types
export type Subjects =
  | 'User'
  | 'Role'
  | 'Permission'
  | 'Organization'
  | 'Invitation'
  | 'AuditLog'
  | 'Patient'
  | 'Appointment'
  | 'MedicalRecord'
  | 'LabResult'
  | 'Billing'
  | 'Report'
  | 'all';

// Define all possible actions
export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'invite'
  | 'assign'
  | 'approve'
  | 'export'
  | 'schedule';

// Define ability type using PureAbility (not deprecated) - Use MongoAbility instead
export type AppAbility = PureAbility<[Actions, Subjects]>;

// Create MongoDB Ability instead of PureAbility
const MongoAbility = createMongoAbility as unknown as AbilityClass<AppAbility>;

// Function to build abilities based on user roles and permissions
export function defineAbilityFor(user: User | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(MongoAbility);

  // If no user, only grant access to public resources
  if (!user) {
    can('read', 'all', { isPublic: true });
    return build();
  }

  // Super Admin has full access
  if (
    user.roles?.some((role) => role.name === 'Super Admin' && role.isSystemRole)
  ) {
    can('manage', 'all');
    return build();
  }

  // Organization Admin has full access to their organization
  if (user.roles?.some((role) => role.name === 'Organization Admin')) {
    // Can manage everything in their organization
    can('manage', 'all', { organizationId: user.organizationId });

    // Cannot access other organizations
    cannot('read', 'Organization', { id: { $ne: user.organizationId } });
    cannot('manage', 'User', { organizationId: { $ne: user.organizationId } });

    // Can see only their organization's audit logs
    can('read', 'AuditLog', { 'user.organizationId': user.organizationId });
  }

  // Doctor role permissions
  if (user.roles?.some((role) => role.name === 'Doctor')) {
    // Can view and update assigned patients
    can('read', 'Patient', { assignedDoctorId: user.id });
    can('read', 'Patient', { departmentId: user.departmentId });

    // Can manage medical records for assigned patients
    can(['create', 'read', 'update'], 'MedicalRecord', {
      patientId: { $in: user.assignedPatients || [] },
    });

    // Can schedule and manage own appointments
    can(['read', 'create', 'update'], 'Appointment', { doctorId: user.id });
    can('read', 'Appointment', { departmentId: user.departmentId });
  }

  // Nurse role permissions
  if (user.roles?.some((role) => role.name === 'Nurse')) {
    // Can view patients in their department
    can('read', 'Patient', { departmentId: user.departmentId });

    // Can update certain medical record types
    can(['read', 'update'], 'MedicalRecord', {
      departmentId: user.departmentId,
      type: { $in: ['VitalSigns', 'Medication', 'Nursing'] },
    });
  }

  // Receptionist role permissions
  if (user.roles?.some((role) => role.name === 'Receptionist')) {
    // Can register and update basic patient info
    can(['create', 'read', 'update'], 'Patient', {
      organizationId: user.organizationId,
    });

    // Can't access detailed medical records
    cannot('read', 'MedicalRecord', {
      type: { $in: ['Diagnosis', 'LabResults', 'Confidential'] },
    });

    // Can manage appointments
    can(['create', 'read', 'update', 'schedule'], 'Appointment', {
      organizationId: user.organizationId,
    });
  }

  // Lab Technician role permissions
  if (user.roles?.some((role) => role.name === 'Lab Technician')) {
    // Can view specific patient records
    can('read', 'Patient', { labRequestIds: { $exists: true } });

    // Can create and update lab results
    can(['create', 'read', 'update'], 'LabResult', { technicianId: user.id });
    can('read', 'LabResult', { departmentId: user.departmentId });

    // Limited access to medical records
    can('read', 'MedicalRecord', {
      type: { $in: ['LabOrder', 'LabResults'] },
      departmentId: user.departmentId,
    });
  }

  // Billing Staff role permissions
  if (user.roles?.some((role) => role.name === 'Billing Staff')) {
    // Can manage patient billing
    can(['create', 'read', 'update'], 'Billing', {
      organizationId: user.organizationId,
    });

    // Can view appointment schedules
    can('read', 'Appointment', { organizationId: user.organizationId });

    // Limited access to patient info and medical records
    can('read', 'Patient', { organizationId: user.organizationId });
    can('read', 'MedicalRecord', {
      type: { $in: ['Billing', 'Insurance'] },
      organizationId: user.organizationId,
    });

    // Can generate financial reports
    can(['read', 'export'], 'Report', {
      type: { $in: ['Financial', 'Billing', 'Insurance'] },
      organizationId: user.organizationId,
    });
  }

  // Apply any additional specific permissions from the user's permission list
  user.permissions?.forEach((permission) => {
    const { action, subject, conditions } = permission;
    if (conditions) {
      can(action as Actions, subject as Subjects, conditions);
    } else {
      can(action as Actions, subject as Subjects);
    }
  });

  // Everyone can manage their own user profile
  can(['read', 'update'], 'User', { id: user.id });

  return build();
}

// Helper function to check if user can perform an action
export function checkAbility(
  ability: AppAbility,
  action: Actions,
  subject: Subjects,
  data?: any
): boolean {
  try {
    ForbiddenError.from(ability).throwUnlessCan(action, subject, data);
    return true;
  } catch (error) {
    return false;
  }
}
