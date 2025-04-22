import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../users/schemas/user.schema';
import { AuthorizationModule } from '../authorization/authorization.module';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import {
  OrganizationRole,
  OrganizationRoleSchema,
} from '../authorization/schemas/organization-role.schema';
import {
  OrganizationInvitation,
  OrganizationInvitationSchema,
} from './schemas/organization.invitation.schema';
import { OrganizationsController } from './controllers/organizations.controller';
import { OrganizationStaffController } from './controllers/organization-staff.controller';
import { OrganizationLinkingController } from './controllers/organization-linking.controller';
import { OrganizationInvitationController } from './controllers/organization-invitation.controller';
import { OrganizationsService } from './services/organizations.service';
import { OrganizationStaffService } from './services/organization-staff.service';
import { OrganizationLinkingService } from './services/organization-linking.service';
import { OrganizationInvitationService } from './services/organization-invitation.service';
import {
  OrganizationLink,
  OrganizationLinkSchema,
} from './schemas/organization.link.schema';
import {
  LinkInvitation,
  LinkInvitationSchema,
} from './schemas/link.invitation';
import { Role, RoleSchema } from '../authorization/schemas/role.schema';
import { UtilsModule } from '@wyecare-monorepo/shared-utils';
import {
  UserMetadata,
  UserMetadataSchema,
} from '../super-admin/schemas/user-metadata.schema';
import { OrganizationContextGuard } from './organization-context.guard';
import { JwtModule } from '@nestjs/jwt';
import {
  StaffInvitation,
  StaffInvitationSchema,
} from './schemas/staff-invitation.schema';
import {
  EmployeeAvailability,
  EmployeeAvailabilitySchema,
} from './schemas/employee.schema';
import {
  ShiftPattern,
  ShiftPatternSchema,
} from '../shift-patterns/schemas/shift-pattern.schema';
import {
  ShiftAssignment,
  ShiftAssignmentSchema,
} from '../shifts/schemas/shift-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationRole.name, schema: OrganizationRoleSchema },
      { name: OrganizationLink.name, schema: OrganizationLinkSchema },
      { name: LinkInvitation.name, schema: LinkInvitationSchema },
      { name: Role.name, schema: RoleSchema },
      {
        name: OrganizationInvitation.name,
        schema: OrganizationInvitationSchema,
      },
      { name: User.name, schema: UserSchema },
      { name: UserMetadata.name, schema: UserMetadataSchema },
      {
        name: StaffInvitation.name,
        schema: StaffInvitationSchema,
      },

      { name: EmployeeAvailability.name, schema: EmployeeAvailabilitySchema },
      { name: ShiftPattern.name, schema: ShiftPatternSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
    ]),
    UtilsModule,
    AuthorizationModule,
    JwtModule.register({
      secret: process.env['JWT_SECRET'],
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [
    OrganizationsController,
    OrganizationStaffController,
    OrganizationLinkingController,
    OrganizationInvitationController,
  ],
  providers: [
    OrganizationsService,
    OrganizationStaffService,
    OrganizationLinkingService,
    OrganizationInvitationService,
    OrganizationContextGuard,
  ],
  exports: [
    OrganizationsService,
    OrganizationStaffService,
    OrganizationLinkingService,
    OrganizationInvitationService,
    OrganizationContextGuard,
  ],
})
export class OrganizationsModule {}
