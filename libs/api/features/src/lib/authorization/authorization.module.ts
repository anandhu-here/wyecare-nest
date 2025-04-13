import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import {
  PermissionImplication,
  PermissionImplicationSchema,
} from './schemas/permission-implication.schema';
import { Role, RoleSchema } from './schemas/role.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  RolePermission,
  RolePermissionSchema,
} from './schemas/role-permission.schema';
import {
  UserCustomPermission,
  UserCustomPermissionSchema,
} from './schemas/user-custom-permission.schema';
import {
  OrganizationRole,
  OrganizationRoleSchema,
} from './schemas/organization-role.schema';
import { PermissionsService } from './services/permissions.service';
import { RolesService } from './services/roles.service';
import { AuthorizationService } from './services/authorization.service';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CurrentOrganizationInterceptor } from './current-organization.interceptor';
import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema';
import { SeedController } from './controllers/seed-permissions.controller';
import { SeedService } from './services/seed.service';

console.log('AuthModule is being loaded');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: PermissionImplication.name, schema: PermissionImplicationSchema },
      { name: Role.name, schema: RoleSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: UserCustomPermission.name, schema: UserCustomPermissionSchema },
      { name: OrganizationRole.name, schema: OrganizationRoleSchema },
      { name: Organization.name, schema: OrganizationSchema }, // Add this line
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    PermissionsService,
    RolesService,
    AuthorizationService,
    SeedService,
  ],
  controllers: [SeedController],
  exports: [
    PermissionsService,
    RolesService,
    AuthorizationService,
    SeedService,
  ],
})
export class AuthorizationModule {}
