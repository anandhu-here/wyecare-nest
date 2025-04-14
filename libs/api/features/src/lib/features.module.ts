import { Module } from '@nestjs/common';
import { AuthorizationModule } from './authorization/authorization.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './authentication/authentication.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ShiftPatternsModule } from './shift-patterns/shift-patterns.module';
import { ShiftsModule } from './shifts/shifts.module';

@Module({
  imports: [
    AuthorizationModule,
    OrganizationsModule,
    AuthModule,
    SuperAdminModule,
    ShiftPatternsModule,
    ShiftsModule,
  ],
  exports: [
    AuthorizationModule,
    OrganizationsModule,
    AuthModule,
    SuperAdminModule,
    ShiftPatternsModule,
    ShiftsModule,
  ],
})
export class FeaturesModule {}
