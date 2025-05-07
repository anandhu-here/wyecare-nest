// apps/api/src/app/shifts/controllers/shift-reports.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { ShiftReportsService } from '../services/shift-reports.service';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { ShiftSchedule } from '../../casl/entities';

class DateRangeDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

@Controller('shift-reports')
@UseGuards(JwtAuthGuard)
export class ShiftReportsController {
  constructor(private readonly shiftReportsService: ShiftReportsService) {}

  @Get('staff/:staffProfileId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  async getStaffHoursReport(
    @Param('staffProfileId') staffProfileId: string,
    @Query() dateRange: DateRangeDto
  ) {
    const startDate =
      dateRange.startDate ||
      new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = dateRange.endDate || new Date();

    return this.shiftReportsService.generateStaffHoursReport(
      staffProfileId,
      startDate,
      endDate
    );
  }

  @Get('department/:departmentId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  async getDepartmentHoursReport(
    @Param('departmentId') departmentId: string,
    @Query() dateRange: DateRangeDto
  ) {
    const startDate =
      dateRange.startDate ||
      new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = dateRange.endDate || new Date();

    return this.shiftReportsService.generateDepartmentHoursReport(
      departmentId,
      startDate,
      endDate
    );
  }

  @Get('organization/:organizationId/coverage')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  async getOrganizationCoverageReport(
    @Param('organizationId') organizationId: string,
    @Query() dateRange: DateRangeDto
  ) {
    const startDate =
      dateRange.startDate ||
      new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = dateRange.endDate || new Date();

    return this.shiftReportsService.generateOrganizationCoverageReport(
      organizationId,
      startDate,
      endDate
    );
  }

  @Get('organization/:organizationId/overtime')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  async getOvertimeReport(
    @Param('organizationId') organizationId: string,
    @Query() dateRange: DateRangeDto
  ) {
    const startDate =
      dateRange.startDate ||
      new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = dateRange.endDate || new Date();

    return this.shiftReportsService.generateOvertimeReport(
      organizationId,
      startDate,
      endDate
    );
  }
}
