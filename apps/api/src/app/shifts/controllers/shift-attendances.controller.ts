// apps/api/src/app/shifts/controllers/shift-attendances.controller.ts
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ShiftAttendancesService } from '../services/shift-attendances.service';
import { CreateShiftAttendanceDto } from '../dto/create-shift-attendance.dto';
import { UpdateShiftAttendanceDto } from '../dto/update-shift-attendance.dto';
import { FindShiftAttendanceDto } from '../dto/find-shift-attendance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/guards/policies.guard';
import { CheckPolicies } from '../../casl/decorators/check-policies.decorator';
import { Action } from '../../casl/enums/actions.enums';
import { ShiftAttendance } from '../../casl/entities';

@ApiTags('Shift Attendances')
@Controller('shift-attendances')
@UseGuards(JwtAuthGuard)
export class ShiftAttendancesController {
  constructor(
    private readonly shiftAttendancesService: ShiftAttendancesService
  ) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.CREATE, ShiftAttendance))
  @ApiOperation({ summary: 'Create a new shift attendance record' })
  @ApiBody({ type: CreateShiftAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'The shift attendance has been successfully created.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Attendance already exists for this shift.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  create(@Body() createShiftAttendanceDto: CreateShiftAttendanceDto) {
    return this.shiftAttendancesService.create(createShiftAttendanceDto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftAttendance))
  @ApiOperation({
    summary: 'Get all shift attendance records with optional filtering',
  })
  @ApiQuery({ type: FindShiftAttendanceDto })
  @ApiResponse({
    status: 200,
    description: 'List of shift attendance records retrieved successfully.',
    type: [ShiftAttendance],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  findAll(@Query() query: FindShiftAttendanceDto) {
    return this.shiftAttendancesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftAttendance))
  @ApiOperation({ summary: 'Get a specific shift attendance record by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the shift attendance record',
  })
  @ApiResponse({
    status: 200,
    description: 'The shift attendance record has been found.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 404,
    description: 'Shift attendance record not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  findOne(@Param('id') id: string) {
    return this.shiftAttendancesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.UPDATE, ShiftAttendance))
  @ApiOperation({ summary: 'Update a shift attendance record' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the shift attendance record to update',
  })
  @ApiBody({ type: UpdateShiftAttendanceDto })
  @ApiResponse({
    status: 200,
    description: 'The shift attendance record has been successfully updated.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 404,
    description: 'Shift attendance record not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  update(
    @Param('id') id: string,
    @Body() updateShiftAttendanceDto: UpdateShiftAttendanceDto
  ) {
    return this.shiftAttendancesService.update(id, updateShiftAttendanceDto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.DELETE, ShiftAttendance))
  @ApiOperation({ summary: 'Delete a shift attendance record' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the shift attendance record to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'The shift attendance record has been successfully deleted.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 404,
    description: 'Shift attendance record not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  remove(@Param('id') id: string) {
    return this.shiftAttendancesService.remove(id);
  }

  @Post(':id/approve')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.UPDATE, ShiftAttendance))
  @ApiOperation({ summary: 'Approve a shift attendance record' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the shift attendance record to approve',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approvedById: {
          type: 'string',
          description: 'ID of the user approving the attendance',
        },
        notes: {
          type: 'string',
          description: 'Optional approval notes',
          nullable: true,
        },
      },
      required: ['approvedById'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The shift attendance record has been successfully approved.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Attendance record is already approved.',
  })
  @ApiResponse({
    status: 404,
    description: 'Shift attendance record not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  approve(
    @Param('id') id: string,
    @Body() approvalData: { approvedById: string; notes?: string }
  ) {
    return this.shiftAttendancesService.approve(
      id,
      approvalData.approvedById,
      approvalData.notes
    );
  }

  @Get('by-shift/:shiftScheduleId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.READ, ShiftAttendance))
  @ApiOperation({ summary: 'Get attendance record for a specific shift' })
  @ApiParam({
    name: 'shiftScheduleId',
    description: 'The ID of the shift schedule',
  })
  @ApiResponse({
    status: 200,
    description: 'The shift attendance record has been found.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  findByShiftSchedule(@Param('shiftScheduleId') shiftScheduleId: string) {
    return this.shiftAttendancesService.findByShiftSchedule(shiftScheduleId);
  }

  @Post('clock-in/:shiftScheduleId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.UPDATE, ShiftAttendance))
  @ApiOperation({ summary: 'Clock in for a shift' })
  @ApiParam({
    name: 'shiftScheduleId',
    description: 'The ID of the shift schedule to clock in for',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully clocked in for the shift.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Already clocked in for this shift.',
  })
  @ApiResponse({ status: 404, description: 'Shift schedule not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  clockIn(@Param('shiftScheduleId') shiftScheduleId: string) {
    return this.shiftAttendancesService.clockIn(shiftScheduleId);
  }

  @Post('clock-out/:shiftScheduleId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies((action) => action.can(Action.UPDATE, ShiftAttendance))
  @ApiOperation({ summary: 'Clock out for a shift' })
  @ApiParam({
    name: 'shiftScheduleId',
    description: 'The ID of the shift schedule to clock out from',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully clocked out from the shift.',
    type: ShiftAttendance,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Already clocked out or not clocked in for this shift.',
  })
  @ApiResponse({
    status: 404,
    description: 'Shift attendance record not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  clockOut(@Param('shiftScheduleId') shiftScheduleId: string) {
    return this.shiftAttendancesService.clockOut(shiftScheduleId);
  }
}
