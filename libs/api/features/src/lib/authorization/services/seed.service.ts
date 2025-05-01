// libs/api/features/src/lib/authorization/services/seed.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Permission,
  PermissionDocument,
} from '../../../../../core/src/lib/schemas';
import {
  PermissionImplication,
  PermissionImplicationDocument,
} from '../../../../../core/src/lib/schemas';
import { Role, RoleDocument } from '../../../../../core/src/lib/schemas';
import {
  RolePermission,
  RolePermissionDocument,
} from '../../../../../core/src/lib/schemas';
import { permissionsData } from './permissionData';
import { rolesData } from './rolesData';
import { User } from '../../../../../core/src/lib/schemas';
import { permissionImplicationsData } from './permissionsImplication';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    @InjectModel(PermissionImplication.name)
    private permissionImplicationModel: Model<PermissionImplicationDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermissionDocument>
  ) {}

  async seedDatabase() {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedPermissionImplications();
    await this.seedRolePermissions();
  }

  async seedPermissions() {
    // Clear existing permissions
    await this.permissionModel.deleteMany({});
    console.log('Cleared existing permissions');

    // Add permissions with the new structure
    // We need to extract organizationCategories and displayNames from the new format
    const formattedPermissionsData = permissionsData.map((permission) => {
      const { organizationCategories, displayNames, ...permissionData } =
        permission;
      return permissionData;
    });

    await this.permissionModel.insertMany(formattedPermissionsData);
    console.log(`Seeded ${formattedPermissionsData.length} permissions`);
  }

  async seedRoles() {
    // Clear existing roles
    await this.roleModel.deleteMany({});
    console.log('Cleared existing roles');

    // Add roles with the new structure
    // We need to extract organizationCategories and displayNames from the new format
    const formattedRolesData = rolesData.map((role) => {
      const { organizationCategories, displayNames, ...roleData } = role;
      return {
        ...roleData,
        organizationCategories: organizationCategories || [],
        displayNames: displayNames || {},
      };
    });

    console.log(formattedRolesData.filter((role) => role.displayNames));

    await this.roleModel.insertMany(formattedRolesData);
    console.log(`Seeded ${formattedRolesData.length} roles`);
  }

  async seedPermissionImplications() {
    // Clear existing permission implications
    await this.permissionImplicationModel.deleteMany({});
    console.log('Cleared existing permission implications');

    await this.permissionImplicationModel.insertMany(
      permissionImplicationsData
    );
    console.log(
      `Seeded ${permissionImplicationsData.length} permission implications`
    );
  }

  async seedRolePermissions() {
    // Clear existing role permissions

    await this.rolePermissionModel.deleteMany({});
    console.log('Cleared existing role permissions');

    // Get all permissions
    const permissions = await this.permissionModel.find({}).lean();
    const permissionMap = permissions.reduce((map: any, permission) => {
      map[permission.id] = permission;
      return map;
    }, {});

    // Get all roles
    const roles = await this.roleModel.find({}).lean();
    const roleMap = roles.reduce((map: any, role) => {
      map[role.id] = role;
      return map;
    }, {});

    // Define role permissions mapping
    const rolePermissions = {
      // Owner has full access
      owner: permissions.map((p) => p.id),

      // Admin has almost full access except some owner-specific functions
      admin: permissions.map((p) => p.id),

      system_admin: [
        'manage_system',
        'create_system_admin',
        'manage_permissions',
        'manage_roles',
        'view_all_organizations',
        'manage_all_organizations',
        'view_all_users',
        'manage_all_users',
        'create_organization',
        'delete_organization',
        'get_permissions',
        'add_permission',
        'remove_permission',
      ],

      // Manager permissions - updated to use generalized subject permissions
      manager: [
        'view_organization',
        'view_staff',
        'view_subjects',
        'edit_subjects',
        'view_schedules',
        'edit_schedules',
        'view_timesheets',
        'approve_timesheets',
        'view_reports',
        'create_reports',
        'view_service_plans',
        'view_service_notes',
        'view_medications',
        'view_health_records',
        'view_health_conditions',
        'view_allergies',
        'view_quality_metrics',
        'view_incident_reports',
        'create_incident_reports',
        'view_dashboard',
        'view_active_tasks',
        'view_tasks',
        'assign_task',
        'view_all_tasks',
        'add_task',
        'resolve_task',
        'view_group',
        'edit_group',
        'create_group',
        'add_group_member',
        'view_shift',
        'create_shift',
        'update_shift',
        'assign_users',
        'manage_leave_requests',
        'view_leave_requests',
        'view_all_leave_balances',
        'view_leave_balance',
      ],

      // Nurse permissions - updated to use generalized permissions
      nurse: [
        'view_subjects',
        'view_schedules',
        'edit_schedules',
        'view_service_plans',
        'create_service_plans',
        'update_service_plans',
        'view_service_notes',
        'create_service_notes',
        'update_service_notes',
        'view_medications',
        'create_medications',
        'update_medications',
        'view_health_records',
        'create_health_records',
        'update_health_records',
        'view_health_conditions',
        'view_allergies',
        'create_incident_reports',
        'view_incident_reports',
        'view_pending_tasks',
        'view_all_tasks',
        'view_historical_tasks',
        'view_subject_profile',
        'scan_timesheets',
        'view_group',
        'create_group',
        'edit_group',
        'view_leave_balance',
        'create_leave_request',
        'view_leave_requests',
        'view_leave_policy',
        'approve_timesheets',
        'add_task',
        'resolve_task',
        'view_subject_tasks',
        'view_active_tasks',
        'view_overdue_tasks',
        'view_task_details',
        'assign_task',
        'view_timesheets',
        'create_timesheets',
      ],

      // Senior carer permissions - updated to use generalized permissions
      senior_carer: [
        'view_subjects',
        'view_schedules',
        'edit_schedules',
        'view_service_plans',
        'view_service_notes',
        'create_service_notes',
        'update_service_notes',
        'view_medications',
        'view_health_records',
        'view_health_conditions',
        'view_allergies',
        'create_incident_reports',
        'view_pending_tasks',
        'view_all_tasks',
        'view_historical_tasks',
        'view_subject_profile',
        'scan_timesheets',
        'view_group',
        'create_group',
        'edit_group',
        'view_leave_balance',
        'create_leave_request',
        'view_leave_requests',
        'view_leave_policy',
        'approve_timesheets',
        'add_task',
        'resolve_task',
        'view_active_tasks',
        'view_overdue_tasks',
        'view_task_details',
        'view_subject_tasks',
        'view_timesheets',
        'create_timesheets',
        'assign_task',
        'transfer_task',
      ],

      // Carer permissions - updated to use generalized permissions
      carer: [
        'view_subjects',
        'view_schedules',
        'view_timesheets',
        'create_timesheets',
        'view_chat',
        'view_providers',
        'view_settings',
        'view_dashboard',
        'view_service_plans',
        'view_service_notes',
        'create_service_notes',
        'view_medications',
        'view_health_conditions',
        'view_allergies',
        'complete_tasks',
        'view_upcoming_tasks',
        'view_pending_tasks',
        'create_incident_reports',
        'view_subject_profile',
        'view_group',
        'view_leave_balance',
        'create_leave_request',
        'view_leave_requests',
        'view_leave_policy',
        'resolve_task',
        'view_active_tasks',
        'view_task_details',
        'view_subject_tasks',
      ],

      // HR manager permissions
      hr_manager: [
        'view_staff',
        'edit_staff_role',
        'view_employee_records',
        'edit_employee_records',
        'view_training_records',
        'edit_training_records',
        'schedule_training',
        'view_payroll',
        'process_payroll',
        'view_timesheets',
        'approve_timesheets',
        'view_reports',
        'create_reports',
        'view_incident_reports',
        'manage_incident_reports',
        'manage_leave_requests',
        'view_leave_requests',
        'view_all_leave_balances',
        'manage_leave_policy',
        'view_leave_policy',
        'view_dashboard',
        'view_organization',
        'invite_staff',
        'view_staff_invitations',
        'manage_staff_invitations',
      ],

      // Accountant permissions
      accountant: [
        'view_invoices',
        'edit_invoices',
        'view_payments',
        'edit_payments',
        'view_payroll',
        'process_payroll',
        'view_financial_reports',
        'create_financial_reports',
        'view_timesheets',
        'view_dashboard',
        'view_organization',
      ],

      // Admin staff permissions - updated to use generalized permissions
      admin_staff: [
        'view_organization',
        'view_staff',
        'view_subjects',
        'view_schedules',
        'view_timesheets',
        'view_locations',
        'view_providers',
        'view_chat',
        'view_invoices',
        'view_payments',
        'view_settings',
        'view_dashboard',
        'view_reports',
        'create_reports',
        'view_inventory',
        'manage_inventory',
      ],

      // Quality assurance permissions - updated to use generalized permissions
      quality_assurance: [
        'view_service_plans',
        'view_service_notes',
        'view_health_records',
        'view_quality_metrics',
        'edit_quality_metrics',
        'view_compliance_reports',
        'manage_compliance',
        'perform_audits',
        'view_incident_reports',
        'manage_incident_reports',
        'view_audit_logs',
        'view_dashboard',
        'view_organization',
        'view_reports',
        'create_reports',
      ],

      // Procurement officer permissions
      procurement_officer: [
        'view_inventory',
        'manage_inventory',
        'view_supplier_contracts',
        'manage_supplier_contracts',
        'view_dashboard',
        'view_organization',
      ],

      // Staff permissions - updated to use generalized permissions
      staff: [
        'view_organization',
        'view_subjects',
        'view_schedules',
        'view_service_plans',
        'view_service_notes',
        'create_service_notes',
        'view_medications',
        'view_health_conditions',
        'view_allergies',
        'create_incident_reports',
        'view_dashboard',
        'view_leave_balance',
        'create_leave_request',
        'view_leave_requests',
        'view_leave_policy',
        'view_timesheets',
        'create_timesheets',
      ],

      // New roles with appropriate permissions
      doctor: [
        'view_subjects',
        'view_subject_profile',
        'view_service_plans',
        'create_service_plans',
        'update_service_plans',
        'view_service_notes',
        'create_service_notes',
        'update_service_notes',
        'view_medications',
        'create_medications',
        'update_medications',
        'view_health_records',
        'create_health_records',
        'update_health_records',
        'view_health_conditions',
        'view_allergies',
        'view_schedules',
        'create_incident_reports',
        'view_incident_reports',
        'view_task_details',
        'view_subject_tasks',
      ],

      teacher: [
        'view_subjects',
        'view_subject_profile',
        'view_service_plans',
        'create_service_plans',
        'update_service_plans',
        'view_service_notes',
        'create_service_notes',
        'update_service_notes',
        'view_schedules',
        'view_task_details',
        'view_subject_tasks',
        'add_task',
        'resolve_task',
      ],

      teaching_assistant: [
        'view_subjects',
        'view_subject_profile',
        'view_service_plans',
        'view_service_notes',
        'create_service_notes',
        'view_schedules',
        'view_task_details',
        'view_subject_tasks',
        'resolve_task',
      ],

      counselor: [
        'view_subjects',
        'view_subject_profile',
        'view_service_plans',
        'create_service_plans',
        'update_service_plans',
        'view_service_notes',
        'create_service_notes',
        'update_service_notes',
        'view_schedules',
        'add_task',
        'view_subject_tasks',
      ],

      social_worker: [
        'view_subjects',
        'view_subject_profile',
        'view_service_plans',
        'create_service_plans',
        'update_service_plans',
        'view_service_notes',
        'create_service_notes',
        'update_service_notes',
        'view_schedules',
        'add_task',
        'view_subject_tasks',
      ],

      customer_service: [
        'view_subjects',
        'view_chat',
        'view_dashboard',
        'view_organization',
      ],
    };

    const rolePermissionsData = [];

    // For each role, build the permission assignments
    for (const [roleName, permissionIds] of Object.entries(rolePermissions)) {
      const role = roleMap[roleName];
      if (!role) {
        console.warn(`Role ${roleName} not found, skipping permissions`);
        continue;
      }

      // Add each permission to the role
      for (const permissionId of permissionIds) {
        const permission = permissionMap[permissionId];
        if (!permission) {
          console.warn(
            `Permission ${permissionId} not found, skipping for role ${roleName}`
          );
          continue;
        }

        rolePermissionsData.push({
          roleId: role.id,
          permissionId: permission.id,
        });
      }
    }

    await this.rolePermissionModel.insertMany(rolePermissionsData);
    console.log(`Seeded ${rolePermissionsData.length} role permissions`);
  }

  async createSuperAdmin(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    countryCode: string;
    gender?: string;
    address?: any;
    countryMetadata?: any;
    systemSecret: string;
  }) {
    // Verify the system secret
    const validSystemSecret = process.env['SUPER_ADMIN_SECRET'];
    console.log(validSystemSecret, 'validSystemSecret');

    if (!validSystemSecret || userData.systemSecret !== validSystemSecret) {
      throw new UnauthorizedException(
        'Invalid system secret for super admin creation'
      );
    }

    // Check if email is valid
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if super admin already exists
    const existingUser = await this.userModel.findOne({
      email: userData.email.toLowerCase(),
    });

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Create the super admin user
    const superAdmin = new this.userModel({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: 'super_admin',
      phone: userData.phone,
      countryCode: userData.countryCode,
      gender: userData.gender || 'not_specified',
      address: userData.address || {},
      countryMetadata: userData.countryMetadata || {},
      emailVerified: true,
      isSuperAdmin: true,
    });
    await superAdmin.save();

    console.log(`Super admin created: ${superAdmin.email}`);

    return {
      id: superAdmin._id,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      email: superAdmin.email,
    };
  }
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
