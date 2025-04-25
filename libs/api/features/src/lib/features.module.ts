// libs/api/features/src/lib/features.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from '@wyecare-monorepo/api/core';

// Import all feature modules
import { AuthorizationModule } from './authorization/authorization.module';
import { AuthModule } from './authentication/authentication.module';
import { EventsModule } from './events/events.module';
import { InvitationsModule } from './invitations/invitations.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ShiftPatternsModule } from './shift-patterns/shift-patterns.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TimesheetsModule } from './timesheets/timesheets.module';
import { UsersModule } from './users/users.module';
import { PictureModule } from './pictures/picture.module';
import { InvoiceModule } from './invoice/invoice.module';
import { EmployeeApplicationModule } from './employee-application/employee-application.module';
import { TemporaryHomeModule } from './temp-home/temp-organization.module';
import { LeavesModule } from './leaves/leaves.module';
import { EmployeeAvailabilityModule } from './employee-availability/employee-availability.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    AuthorizationModule,
    EventsModule,
    InvitationsModule,
    OrganizationsModule,
    ShiftPatternsModule,
    ShiftsModule,
    SuperAdminModule,
    TimesheetsModule,
    UsersModule,
    PictureModule,
    InvoiceModule,
    EmployeeApplicationModule,
    TemporaryHomeModule,
    LeavesModule,
    EmployeeAvailabilityModule,
    AttendanceModule,
  ],
  exports: [
    PictureModule,
    AuthModule,
    AuthorizationModule,
    EventsModule,
    InvitationsModule,
    OrganizationsModule,
    ShiftPatternsModule,
    ShiftsModule,
    SuperAdminModule,
    TimesheetsModule,
    UsersModule,
    InvoiceModule,
    EmployeeApplicationModule,
    TemporaryHomeModule,
    LeavesModule,
    EmployeeAvailabilityModule,
    AttendanceModule,
  ],
})
export class FeaturesModule {}
