import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Users
import { User, UserSchema } from './users/user.schema';

// Organizations
import {
  Organization,
  OrganizationSchema,
} from './organizations/organization.schema';
import {
  OrganizationLink,
  OrganizationLinkSchema,
} from './organizations/organization.link.schema';
import {
  OrganizationInvitation,
  OrganizationInvitationSchema,
} from './organizations/organization.invitation.schema';
import {
  StaffInvitation,
  StaffInvitationSchema,
} from './organizations/staff-invitation.schema';

// Authorization
import {
  OrganizationRole,
  OrganizationRoleSchema,
} from './authorization/organization-role.schema';
import {
  Permission,
  PermissionSchema,
} from './authorization/permission.schema';
import { Role, RoleSchema } from './authorization/role.schema';
import {
  RolePermission,
  RolePermissionSchema,
} from './authorization/role-permission.schema';
import {
  PermissionImplication,
  PermissionImplicationSchema,
} from './authorization/permission-implication.schema';
import {
  UserCustomPermission,
  UserCustomPermissionSchema,
} from './authorization/user-custom-permission.schema';

// Shifts
import { Shift, ShiftSchema } from './shifts/shift.schema';
import {
  ShiftAssignment,
  ShiftAssignmentSchema,
} from './shifts/shift-assignment.schema';

// Timesheets
import { Timesheet, TimesheetSchema } from './timesheets/timesheet.schema';

// Shift patterns
import {
  ShiftPattern,
  ShiftPatternSchema,
} from './shift-patterns/shift-pattern.schema';
import {
  HomeTiming,
  HomeTimingSchema,
} from './shift-patterns/home-timing.schema';
import { Rate, RateSchema } from './shift-patterns/rate.schema';
import {
  UserTypeRate,
  UserTypeRateSchema,
} from './shift-patterns/user-type-rate.schema';

// Invitations
import {
  OrganizationCreationInvitation,
  OrganizationCreationInvitationSchema,
} from './invitations/organization-creation-invitation.schema';
import {
  StaffInvitation as InvitationStaffInvitation,
  StaffInvitationSchema as InvitationStaffInvitationSchema,
} from './invitations/staff-invitation.schema';
import {
  EmployeeAvailability,
  EmployeeAvailabilitySchema,
} from './organizations/employee.schema';

// Super Admin
import {
  OrganizationCreationInvitation as SuperAdminOrgInvitation,
  OrganizationCreationInvitationSchema as SuperAdminOrgInvitationSchema,
} from './super-admin/organization-creation-invitation.schema';
import {
  UserMetadata,
  UserMetadataSchema,
} from './super-admin/user-metadata.schema';
import {
  LinkInvitation,
  LinkInvitationSchema,
} from './organizations/link.invitation';
import { Invoice, InvoiceSchema } from './invoice/invoice.schema';
import {
  UserNotification,
  UserNotificationSchema,
} from './notifications/user-notification.schema';
import {
  EmployeeApplication,
  EmployeeApplicationSchema,
} from './employee/employee-application.schema';
import {
  TemporaryHome,
  TemporaryHomeSchema,
} from './organizations/temporary-home';
import {
  LeaveRequest,
  LeaveRequestSchema,
} from './leaves/leave-request.schema';
import {
  LeaveBalance,
  LeaveBalanceSchema,
} from './leaves/leave-balance.schema';
import { LeavePolicy, LeavePolicySchema } from './leaves/leave-policy.schema';
import {
  Attendance,
  AttendanceSchema,
} from './organizations/attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      // Users
      { name: User.name, schema: UserSchema },

      // Organizations
      { name: Organization.name, schema: OrganizationSchema },
      { name: EmployeeAvailability.name, schema: EmployeeAvailabilitySchema },
      { name: OrganizationLink.name, schema: OrganizationLinkSchema },
      {
        name: OrganizationInvitation.name,
        schema: OrganizationInvitationSchema,
      },
      { name: StaffInvitation.name, schema: StaffInvitationSchema },

      // Authorization
      { name: OrganizationRole.name, schema: OrganizationRoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Role.name, schema: RoleSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: PermissionImplication.name, schema: PermissionImplicationSchema },
      { name: UserCustomPermission.name, schema: UserCustomPermissionSchema },

      // Shifts
      { name: Shift.name, schema: ShiftSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },

      // Timesheets
      { name: Timesheet.name, schema: TimesheetSchema },

      // Shift patterns
      { name: ShiftPattern.name, schema: ShiftPatternSchema },
      { name: HomeTiming.name, schema: HomeTimingSchema },
      { name: Rate.name, schema: RateSchema },
      { name: UserTypeRate.name, schema: UserTypeRateSchema },

      // Invitations
      {
        name: OrganizationCreationInvitation.name,
        schema: OrganizationCreationInvitationSchema,
      },
      {
        name: InvitationStaffInvitation.name,
        schema: InvitationStaffInvitationSchema,
      },

      {
        name: LinkInvitation.name,
        schema: LinkInvitationSchema,
      },

      //super admin
      {
        name: SuperAdminOrgInvitation.name,
        schema: SuperAdminOrgInvitationSchema,
      },
      { name: UserMetadata.name, schema: UserMetadataSchema },

      {
        name: Invoice.name,
        schema: InvoiceSchema,
      },
      {
        name: UserNotification.name,
        schema: UserNotificationSchema,
      },
      {
        name: EmployeeApplication.name,
        schema: EmployeeApplicationSchema,
      },
      {
        name: TemporaryHome.name,
        schema: TemporaryHomeSchema,
      },
      {
        name: LeaveRequest.name,
        schema: LeaveRequestSchema,
      },
      {
        name: LeaveBalance.name,
        schema: LeaveBalanceSchema,
      },
      {
        name: LeavePolicy.name,
        schema: LeavePolicySchema,
      },
      {
        name: Attendance.name,
        schema: AttendanceSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class ModelsModule {}
