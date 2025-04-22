import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';

import { UtilsModule } from '@wyecare-monorepo/shared-utils';
import { AuthController } from './controllers/authentication.controller';
import { AuthService } from './services/authentication.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import {
  OrganizationRole,
  OrganizationRoleSchema,
} from '../authorization/schemas/organization-role.schema';
import {
  UserCustomPermission,
  UserCustomPermissionSchema,
} from '../authorization/schemas/user-custom-permission.schema';
import {
  RolePermission,
  RolePermissionSchema,
} from '../authorization/schemas/role-permission.schema';
import {
  PermissionImplication,
  PermissionImplicationSchema,
} from '../authorization/schemas/permission-implication.schema';
import { Role, RoleSchema } from '../authorization/schemas/role.schema';
import {
  Permission,
  PermissionSchema,
} from '../authorization/schemas/permission.schema';
import { OrganizationsModule } from '../organizations/organizations.module';
import { OrganizationInvitationService } from '../super-admin/services/organization-invitation.service';
import {
  UserMetadata,
  UserMetadataSchema,
} from '../super-admin/schemas/user-metadata.schema';
import {
  OrganizationCreationInvitation,
  OrganizationCreationInvitationSchema,
} from '../super-admin/schemas/organization-creation-invitation.schema';
import { EmailService } from 'libs/shared/utils/src/lib/services/email.service';
import { AuthorizationService } from '../authorization/services/authorization.service';
import { PermissionsService } from '../authorization/services/permissions.service';
import { RolesService } from '../authorization/services/roles.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { TestController } from './controllers/test-controller';
import { AuthorizationModule } from '../authorization/authorization.module';
import { OrganizationStaffService } from '../organizations/services/organization-staff.service';
import {
  StaffInvitation,
  StaffInvitationSchema,
} from '../organizations/schemas/staff-invitation.schema';
import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema';
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OrganizationRole.name, schema: OrganizationRoleSchema },
      { name: UserMetadata.name, schema: UserMetadataSchema },
      {
        name: OrganizationCreationInvitation.name,
        schema: OrganizationCreationInvitationSchema,
      },
      { name: UserCustomPermission.name, schema: UserCustomPermissionSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: PermissionImplication.name, schema: PermissionImplicationSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: StaffInvitation.name, schema: StaffInvitationSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    AuthorizationModule,
    OrganizationsModule,
    UtilsModule,
  ],
  controllers: [AuthController, TestController],
  providers: [
    AuthService,
    JwtStrategy,
    OrganizationInvitationService,
    EmailService,
    AuthorizationService,
    PermissionsService,
    RolesService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
