// apps/api/src/app/shifts/shifts.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { ShiftTypesController } from './controllers/shift-types.controller';
import { ShiftTypesService } from './services/shift-types.service';
import { ShiftSchedulesController } from './controllers/shift-schedules.controller';
import { ShiftSchedulesService } from './services/shift-schedules.service';
import { ShiftAttendancesController } from './controllers/shift-attendances.controller';
import { ShiftAttendancesService } from './services/shift-attendances.service';
import { ShiftUtilsService } from './services/shift-utils.service';
import { ShiftReportsService } from './services/shift-reports.service';
import { ShiftReportsController } from './controllers/shift-reports.controller';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [
    ShiftTypesController,
    ShiftSchedulesController,
    ShiftAttendancesController,
    ShiftReportsController,
  ],
  providers: [
    ShiftTypesService,
    ShiftSchedulesService,
    ShiftAttendancesService,
    ShiftUtilsService,
    ShiftReportsService,
  ],
  exports: [
    ShiftTypesService,
    ShiftSchedulesService,
    ShiftAttendancesService,
    ShiftUtilsService,
    ShiftReportsService,
  ],
})
export class ShiftsModule {}
