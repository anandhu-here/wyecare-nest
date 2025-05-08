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
import { PaymentRulesController } from './controllers/payment-rules.controller';
import { PaymentRulesService } from './services/payment-rules.service';
import { ShiftTypePremiumsService } from './services/shift-type-premiums.service';
import { ShiftTypePremiumsController } from './controllers/shift-type-premiums.controller';
import { StaffCompensationRatesController } from './controllers/staff-compensation-rates.controller';
import { StaffCompensationRatesService } from './services/staff-compensation-rates.service';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [
    ShiftTypesController,
    ShiftSchedulesController,
    ShiftAttendancesController,
    ShiftReportsController,
    PaymentRulesController,
    ShiftTypePremiumsController,
    StaffCompensationRatesController,
  ],
  providers: [
    ShiftTypesService,
    ShiftSchedulesService,
    ShiftAttendancesService,
    ShiftUtilsService,
    ShiftReportsService,
    PaymentRulesService,
    ShiftTypePremiumsService,
    StaffCompensationRatesService,
  ],
  exports: [
    ShiftTypesService,
    ShiftSchedulesService,
    ShiftAttendancesService,
    ShiftUtilsService,
    ShiftReportsService,
    PaymentRulesService,
    ShiftTypePremiumsService,
    StaffCompensationRatesService,
  ],
})
export class ShiftsModule {}
