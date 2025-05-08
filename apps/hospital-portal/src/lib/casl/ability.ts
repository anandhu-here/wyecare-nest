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
export type AppAbility = PureAbility<[Actions, Subjects]>;
const MongoAbility = createMongoAbility as unknown as AbilityClass<AppAbility>;
export function defineAbilityFor(user: User | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(MongoAbility);
  console.log('User roles:', user?.roles);
  if (!user) {
    can('read', 'all', { isPublic: true });
    return build();
  }
  if (
    user.roles?.some((role) => role.name === 'Super Admin' && role.isSystemRole)
  ) {
    can('manage', 'all');
    return build();
  }
  if (user.roles?.some((role) => role.name === 'Organization Admin')) {
    can('manage', 'User');
    can('manage', 'all', { organizationId: user.organizationId });
    cannot('read', 'Organization', { id: { $ne: user.organizationId } });
    cannot('manage', 'User', { organizationId: { $ne: user.organizationId } });
    can('read', 'AuditLog', { 'user.organizationId': user.organizationId });
  }
  if (user.roles?.some((role) => role.name === 'Doctor')) {
    can('read', 'Patient', { assignedDoctorId: user.id });
    can('read', 'Patient', { departmentId: user.departmentId });
    can(['create', 'read', 'update'], 'MedicalRecord', {
      patientId: { $in: user.assignedPatients || [] },
    });
    can(['read', 'create', 'update'], 'Appointment', { doctorId: user.id });
    can('read', 'Appointment', { departmentId: user.departmentId });
  }
  if (user.roles?.some((role) => role.name === 'Nurse')) {
    can('read', 'Patient', { departmentId: user.departmentId });
    can(['read', 'update'], 'MedicalRecord', {
      departmentId: user.departmentId,
      type: { $in: ['VitalSigns', 'Medication', 'Nursing'] },
    });
  }
  if (user.roles?.some((role) => role.name === 'Receptionist')) {
    can(['create', 'read', 'update'], 'Patient', {
      organizationId: user.organizationId,
    });
    cannot('read', 'MedicalRecord', {
      type: { $in: ['Diagnosis', 'LabResults', 'Confidential'] },
    });
    can(['create', 'read', 'update', 'schedule'], 'Appointment', {
      organizationId: user.organizationId,
    });
  }
  if (user.roles?.some((role) => role.name === 'Lab Technician')) {
    can('read', 'Patient', { labRequestIds: { $exists: true } });
    can(['create', 'read', 'update'], 'LabResult', { technicianId: user.id });
    can('read', 'LabResult', { departmentId: user.departmentId });
    can('read', 'MedicalRecord', {
      type: { $in: ['LabOrder', 'LabResults'] },
      departmentId: user.departmentId,
    });
  }
  if (user.roles?.some((role) => role.name === 'Billing Staff')) {
    can(['create', 'read', 'update'], 'Billing', {
      organizationId: user.organizationId,
    });
    can('read', 'Appointment', { organizationId: user.organizationId });
    can('read', 'Patient', { organizationId: user.organizationId });
    can('read', 'MedicalRecord', {
      type: { $in: ['Billing', 'Insurance'] },
      organizationId: user.organizationId,
    });
    can(['read', 'export'], 'Report', {
      type: { $in: ['Financial', 'Billing', 'Insurance'] },
      organizationId: user.organizationId,
    });
  }
  user.permissions?.forEach((permission) => {
    const { action, subject, conditions } = permission;
    if (conditions) {
      can(action as Actions, subject as Subjects, conditions);
    } else {
      can(action as Actions, subject as Subjects);
    }
  });
  can(['read', 'update'], 'User', { id: user.id });
  return build();
}
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
