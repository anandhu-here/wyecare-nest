// app/hospital/controllers/shift-attendances.controller.ts

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
import { ShiftAttendancesService } from '../services/shift-attendances.service';
import { CreateShiftAttendanceDto } from '../dto/create-shift-attendance.dto';
import { UpdateShiftAttendanceDto } from '../dto/update-shift-attendance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { ShiftAttendance } from '../../casl/entities';

@ApiTags('hospital/shift-attendances')
@Controller('hospital/shift-attendances')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftAttendancesController {
  constructor(
    private readonly shiftAttendancesService: ShiftAttendancesService
  ) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.CREATE, ShiftAttendance))
  @ApiOperation({ summary: 'Create a new shift attendance record' })
  @ApiResponse({
    status: 201,
    description: 'The shift attendance has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Shift Schedule not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Attendance record already exists.',
  })
  create(
    @Body() createShiftAttendanceDto: CreateShiftAttendanceDto,
    @Request() req
  ) {
    return this.shiftAttendancesService.create(
      createShiftAttendanceDto,
      req.user
    );
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, ShiftAttendance))
  @ApiOperation({ summary: 'Get all shift attendance records' })
  @ApiResponse({
    status: 200,
    description: 'Return all shift attendance records.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: Date })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
    @Query('date') date?: Date,
    @Query('departmentId') departmentId?: string,
    @Request() req?
  ) {
    const where: any = {
      ...(status && { status }),
      shiftSchedule: {
        ...(date && {
          startDateTime: { lte: new Date(date) },
          endDateTime: { gte: new Date(date) },
        }),
        ...(departmentId && { departmentId }),
      },
    };

    return this.shiftAttendancesService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: {
        shiftSchedule: {
          startDateTime: 'desc',
        },
      },
      currentUser: req.user,
    });
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.READ, ShiftAttendance))
  @ApiOperation({ summary: 'Get shift attendance by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the shift attendance record.',
  })
  @ApiResponse({ status: 404, description: 'Shift attendance not found.' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.shiftAttendancesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.UPDATE, ShiftAttendance))
  @ApiOperation({ summary: 'Update shift attendance by ID' })
  @ApiResponse({
    status: 200,
    description: 'The shift attendance has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Shift attendance not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  update(
    @Param('id') id: string,
    @Body() updateShiftAttendanceDto: UpdateShiftAttendanceDto,
    @Request() req
  ) {
    return this.shiftAttendancesService.update(
      id,
      updateShiftAttendanceDto,
      req.user
    );
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.DELETE, ShiftAttendance))
  @ApiOperation({ summary: 'Delete shift attendance by ID' })
  @ApiResponse({
    status: 200,
    description: 'The shift attendance has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Shift attendance not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.shiftAttendancesService.remove(id, req.user);
  }
}
