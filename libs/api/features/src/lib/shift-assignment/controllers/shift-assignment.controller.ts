// libs/api/features/src/lib/shifts/controllers/shift-assignments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Logger,
  Query,
  Patch,
} from '@nestjs/common';
import { CreateShiftAssignmentDto } from '../dto/create-shift-assignment.dto';
import { UpdateShiftAssignmentDto } from '../dto/update-shift-assignment.dto';
import { BulkCreateShiftAssignmentsDto } from '../dto/bulk-create-shift-assignments.dto';
import { RecordClockEventDto } from '../dto/clock-event.dto';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../authorization/permission.guard';
import { Auth } from '../../authorization/auth.decorator';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';

import { ShiftStatus } from '@wyecare-monorepo/core';
import { ShiftAssignmentsService } from '../services/shift-assignment.service';

@Controller('shift-assignments')
@UseGuards(JwtAuthGuard)
export class ShiftAssignmentsController {
  private readonly logger = new Logger(ShiftAssignmentsController.name);

  constructor(
    private readonly shiftAssignmentsService: ShiftAssignmentsService
  ) {}

  @Post()
  @UseGuards(PermissionGuard)
  @Auth('create_shift_assignment')
  async create(
    @Body() createShiftAssignmentDto: CreateShiftAssignmentDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // If organizationId not provided, use the current organization
      if (!createShiftAssignmentDto.organizationId) {
        createShiftAssignmentDto.organizationId = organizationId;
      }

      // Set assignedBy if not provided
      if (!createShiftAssignmentDto.assignedBy) {
        createShiftAssignmentDto.assignedBy = req.user.id;
      }

      const result = await this.shiftAssignmentsService.create(
        createShiftAssignmentDto
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error creating shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('bulk')
  @UseGuards(PermissionGuard)
  @Auth('create_shift_assignment')
  async createBulk(
    @Body() bulkDto: BulkCreateShiftAssignmentsDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // Use organization ID from request if not provided in DTO
      const targetOrgId = bulkDto.organizationId || organizationId;

      // Set assignedBy for all shifts if not provided
      for (const shift of bulkDto.shifts) {
        if (!shift.organizationId) {
          shift.organizationId = targetOrgId;
        }

        if (!shift.assignedBy) {
          shift.assignedBy = req.user.id;
        }
      }

      const result = await this.shiftAssignmentsService.createBulk(
        bulkDto.shifts,
        targetOrgId
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error creating bulk shift assignments: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findAll(@Req() req: any, @Query() query: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // Parse query parameters
      const options: any = {};

      if (query.status) {
        options.status = query.status;
      }

      if (query.startDate) {
        options.startDate = new Date(query.startDate);
      }

      if (query.endDate) {
        options.endDate = new Date(query.endDate);
      }

      if (query.workerId) {
        options.workerId = query.workerId;
      }

      if (query.departmentId) {
        options.departmentId = query.departmentId;
      }

      if (query.locationId) {
        options.locationId = query.locationId;
      }

      if (query.shiftTypeId) {
        options.shiftTypeId = query.shiftTypeId;
      }

      if (query.isOvertime !== undefined) {
        options.isOvertime = query.isOvertime === 'true';
      }

      if (query.isHoliday !== undefined) {
        options.isHoliday = query.isHoliday === 'true';
      }

      if (query.isWeekend !== undefined) {
        options.isWeekend = query.isWeekend === 'true';
      }

      if (query.isNightShift !== undefined) {
        options.isNightShift = query.isNightShift === 'true';
      }

      if (query.search) {
        options.search = query.search;
      }

      if (query.tags) {
        options.tags = Array.isArray(query.tags) ? query.tags : [query.tags];
      }

      const results = await this.shiftAssignmentsService.findAll(
        organizationId,
        options
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding all shift assignments: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('worker/:workerId')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findByWorker(
    @Param('workerId') workerId: string,
    @Req() req: any,
    @Query() query: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let status: string[] | undefined;

      if (query.startDate) {
        startDate = new Date(query.startDate);
      }

      if (query.endDate) {
        endDate = new Date(query.endDate);
      }

      if (query.status) {
        status = Array.isArray(query.status) ? query.status : [query.status];
      }

      const results = await this.shiftAssignmentsService.findByWorker(
        organizationId,
        workerId,
        startDate,
        endDate,
        status
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding worker shifts: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('worker/:workerId/hours')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getWorkerHours(
    @Param('workerId') workerId: string,
    @Req() req: any,
    @Query() query: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      if (!query.startDate || !query.endDate) {
        throw new Error('startDate and endDate are required');
      }

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      const result = await this.shiftAssignmentsService.getWorkerHours(
        organizationId,
        workerId,
        startDate,
        endDate
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error getting worker hours: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.shiftAssignmentsService.findOne(
        id,
        organizationId
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error finding shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Put(':id')
  @Auth('edit_shift_assignment')
  async update(
    @Param('id') id: string,
    @Body() updateShiftAssignmentDto: UpdateShiftAssignmentDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // Set updatedBy if not provided
      if (!updateShiftAssignmentDto.updatedBy) {
        updateShiftAssignmentDto.updatedBy = req.user.id;
      }

      const result = await this.shiftAssignmentsService.update(
        id,
        organizationId,
        updateShiftAssignmentDto
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error updating shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Patch(':id/status')
  @Auth('edit_shift_assignment')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ShiftStatus,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      const userId = req.user.id;

      const result = await this.shiftAssignmentsService.updateStatus(
        id,
        organizationId,
        status,
        userId
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error updating shift status: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('clock')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async recordClockEvent(
    @Body() clockEventDto: RecordClockEventDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // Set verifiedBy if not provided and if it's a verify action
      if (!clockEventDto.verifiedBy) {
        clockEventDto.verifiedBy = req.user.id;
      }

      const result = await this.shiftAssignmentsService.recordClockEvent(
        organizationId,
        clockEventDto
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error recording clock event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post(':id/calculate-payment')
  @Auth('calculate_shift_payment')
  async calculatePayment(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.shiftAssignmentsService.calculatePayment(
        id,
        organizationId
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error calculating shift payment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Delete(':id')
  @Auth('delete_shift_assignment')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.shiftAssignmentsService.remove(id, organizationId);
    } catch (error: any) {
      this.logger.error(
        `Error removing shift assignment: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('generate-from-pattern')
  @Auth('create_shift_assignment')
  async generateFromPattern(
    @Body()
    patternData: {
      patternId: string;
      startDate: string;
      endDate: string;
      workerId: string;
    },
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result =
        await this.shiftAssignmentsService.generateShiftsFromPattern(
          organizationId,
          patternData.patternId,
          new Date(patternData.startDate),
          new Date(patternData.endDate),
          patternData.workerId
        );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error generating shifts from pattern: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
