// timesheets/timesheets.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimesheetsController } from './controllers/timesheets.controller';
import { TimesheetsService } from './services/timesheets.service';
import { ShiftsModule } from '../shifts/shifts.module';
import { ShiftPatternsModule } from '../shift-patterns/shift-patterns.module';
import { UsersModule } from '../users/users.module';
import { CoreModule } from '../../../../core/src/lib/core.module';
import { OrganizationsModule } from '../organizations/organizations.module';
@Module({
  imports: [
    CoreModule,
    ShiftsModule,
    ShiftPatternsModule,
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [TimesheetsController],
  providers: [TimesheetsService],
  exports: [TimesheetsService],
})
export class TimesheetsModule {}
