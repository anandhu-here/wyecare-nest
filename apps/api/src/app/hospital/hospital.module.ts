// app/hospital/hospital.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';

// Controllers
import { ShiftTypesController } from './controllers/shift-types.controller';
import { ShiftSchedulesController } from './controllers/shift-schedules.controller';
import { ShiftAttendancesController } from './controllers/shift-attendances.controller';
import { PayPeriodsController } from './controllers/pay-periods.controller';
import { StaffPaymentsController } from './controllers/staff-payments.controller';

// Services
import { ShiftTypesService } from './services/shift-types.service';
import { StaffProfilesService } from './services/staff-profiles.service';
import { ShiftSchedulesService } from './services/shift-schedules.service';
import { ShiftAttendancesService } from './services/shift-attendances.service';
import { PayPeriodsService } from './services/pay-periods.service';
import { StaffPaymentsService } from './services/staff-payments.service';
import { StaffProfilesController } from './controllers/staff-profile.controller';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [
    ShiftTypesController,
    StaffProfilesController,
    ShiftSchedulesController,
    ShiftAttendancesController,
    PayPeriodsController,
    StaffPaymentsController,
  ],
  providers: [
    ShiftTypesService,
    StaffProfilesService,
    ShiftSchedulesService,
    ShiftAttendancesService,
    PayPeriodsService,
    StaffPaymentsService,
  ],
  exports: [
    ShiftTypesService,
    StaffProfilesService,
    ShiftSchedulesService,
    ShiftAttendancesService,
    PayPeriodsService,
    StaffPaymentsService,
  ],
})
export class HospitalModule {}
