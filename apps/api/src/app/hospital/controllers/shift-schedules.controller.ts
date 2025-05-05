// app/hospital/controllers/shift-schedules.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ShiftSchedulesService } from '../services/shift-schedules.service';
import { CreateShiftScheduleDto } from '../dto/create-shift-schedule.dto';
import { UpdateShiftScheduleDto } from '../dto/update-shift-schedule.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { ShiftSchedule } from '../../casl/entities';

@ApiTags('hospital/shift-schedules')
@Controller('hospital/shift-schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftSchedulesController {
  constructor(private readonly shiftSchedulesService: ShiftSchedulesService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, ShiftSchedule))
  @ApiOperation({ summary: 'Create a new shift schedule' })
  @ApiResponse({
    status: 201,
    description: 'The shift schedule has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 404,
    description: 'Staff Profile, Shift Type, or Department not found.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - Staff member already has a shift during this time.',
  })
  create(
    @Body() createShiftScheduleDto: CreateShiftScheduleDto,
    @Request() req
  ) {
    return this.shiftSchedulesService.create(createShiftScheduleDto, req.user);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, ShiftSchedule))
  @ApiOperation({ summary: 'Get all shift schedules' })
  @ApiResponse({ status: 200, description: 'Return all shift schedules.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'staffProfileId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('departmentId') departmentId?: string,
    @Query('staffProfileId') staffProfileId?: string,
    @Query('status') status?: string,
    @Request() req?
  ) {
    const where = {
      ...(startDate && { startDateTime: { gte: new Date(startDate) } }),
      ...(endDate && { endDateTime: { lte: new Date(endDate) } }),
      ...(departmentId && { departmentId }),
      ...(staffProfileId && { staffProfileId }),
      ...(status && { status }),
    };

    return this.shiftSchedulesService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { startDateTime: 'asc' },
      currentUser: req.user,
    });
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, ShiftSchedule))
  @ApiOperation({ summary: 'Get shift schedule by ID' })
  @ApiResponse({ status: 200, description: 'Return the shift schedule.' })
  @ApiResponse({ status: 404, description: 'Shift schedule not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.shiftSchedulesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, ShiftSchedule))
  @ApiOperation({ summary: 'Update shift schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'The shift schedule has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Shift schedule not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - Staff member already has a shift during this time.',
  })
  update(
    @Param('id') id: string,
    @Body() updateShiftScheduleDto: UpdateShiftScheduleDto,
    @Request() req
  ) {
    return this.shiftSchedulesService.update(
      id,
      updateShiftScheduleDto,
      req.user
    );
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, ShiftSchedule))
  @ApiOperation({ summary: 'Delete shift schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'The shift schedule has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Shift schedule not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot delete shift with attendance records.',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.shiftSchedulesService.remove(id, req.user);
  }
}
