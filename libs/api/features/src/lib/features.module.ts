import { Module } from '@nestjs/common';
import { AuthorizationModule } from './authorization/authorization.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './authentication/authentication.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    AuthorizationModule,
    OrganizationsModule,
    AuthModule,
    SuperAdminModule,
  ],
  exports: [
    AuthorizationModule,
    OrganizationsModule,
    AuthModule,
    SuperAdminModule,
  ],
})
export class FeaturesModule {}
