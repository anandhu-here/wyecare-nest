// apps/api/src/app/shifts/controllers/shift-schedules.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShiftSchedulesService } from '../services/shift-schedules.service';
import { CreateShiftScheduleDto } from '../dto/create-shift-schedule.dto';
import { UpdateShiftScheduleDto } from '../dto/update-shift-schedule.dto';
import { FindShiftScheduleDto } from '../dto/find-shift-schedule.dto';
import { BulkCreateShiftScheduleDto } from '../dto/bulk-create-shift-schedule.dto';
import { SwapShiftDto } from '../dto/swap-shift.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { ShiftSchedule } from '../../casl/entities';

@Controller('shift-schedules')
@UseGuards(JwtAuthGuard)
export class ShiftSchedulesController {
  constructor(private readonly shiftSchedulesService: ShiftSchedulesService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.CREATE, ShiftSchedule))
  create(@Body() createShiftScheduleDto: CreateShiftScheduleDto) {
    return this.shiftSchedulesService.create(createShiftScheduleDto);
  }

  @Post('bulk')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.CREATE, ShiftSchedule))
  bulkCreate(@Body() bulkCreateDto: BulkCreateShiftScheduleDto) {
    return this.shiftSchedulesService.bulkCreate(bulkCreateDto.shifts);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  findAll(@Query() query: FindShiftScheduleDto) {
    return this.shiftSchedulesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  findOne(@Param('id') id: string) {
    return this.shiftSchedulesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.UPDATE, ShiftSchedule))
  update(
    @Param('id') id: string,
    @Body() updateShiftScheduleDto: UpdateShiftScheduleDto
  ) {
    return this.shiftSchedulesService.update(id, updateShiftScheduleDto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.DELETE, ShiftSchedule))
  remove(@Param('id') id: string) {
    return this.shiftSchedulesService.remove(id);
  }

  @Get('staff/:staffProfileId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  findByStaff(
    @Param('staffProfileId') staffProfileId: string,
    @Query() query: Omit<FindShiftScheduleDto, 'staffProfileId'>
  ) {
    return this.shiftSchedulesService.findByStaff(staffProfileId, query);
  }

  @Get('department/:departmentId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftSchedule))
  findByDepartment(
    @Param('departmentId') departmentId: string,
    @Query() query: Omit<FindShiftScheduleDto, 'departmentId'>
  ) {
    return this.shiftSchedulesService.findByDepartment(departmentId, query);
  }

  @Post('swap')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.UPDATE, ShiftSchedule))
  swapShifts(@Body() swapShiftDto: SwapShiftDto) {
    return this.shiftSchedulesService.swapShifts(
      swapShiftDto.sourceShiftId,
      swapShiftDto.targetShiftId,
      swapShiftDto.reason
    );
  }
}
