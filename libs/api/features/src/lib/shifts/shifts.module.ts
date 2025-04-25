// Update shifts.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftsController } from './controllers/shifts.controller';
import { ShiftsService } from './services/shifts.service';

import { OrganizationsModule } from '../organizations/organizations.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DashboardService } from './services/dashboard.service';
import { CoreModule } from '@wyecare-monorepo/core';
import { ShiftAnalyticsController } from './controllers/shift-analytic.controller';
import { ShiftAnalyticsService } from './services/shift-analytic.service';

@Module({
  imports: [CoreModule, OrganizationsModule, AuthorizationModule],
  controllers: [ShiftsController, ShiftAnalyticsController],
  providers: [ShiftsService, DashboardService, ShiftAnalyticsService],
  exports: [ShiftsService, DashboardService],
})
export class ShiftsModule {}
