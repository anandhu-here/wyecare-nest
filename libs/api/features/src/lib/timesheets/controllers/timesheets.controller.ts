// libs/api/features/src/lib/timesheets/controllers/timesheets.controller.ts
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
} from '@nestjs/common';
import { TimesheetsService } from '../services/timesheets.service';
import { CreateTimesheetDto } from '../dto/create-timesheet.dto';
import { UpdateTimesheetDto } from '../dto/update-timesheet.dto';
import { GenerateTimesheetDto } from '../dto/generate-timesheet.dto';
import { BulkGenerateTimesheetsDto } from '../dto/bulk-generate-timesheets.dto';
import { TimesheetApprovalDto } from '../dto/timesheet-approval.dto';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { PermissionGuard } from '../../authorization/permission.guard';
import { Auth } from '../../authorization/auth.decorator';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';

@Controller('timesheets')
@UseGuards(JwtAuthGuard)
export class TimesheetsController {
  private readonly logger = new Logger(TimesheetsController.name);

  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @Auth('create_timesheet')
  async create(
    @Body() createTimesheetDto: CreateTimesheetDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // If organizationId not provided, use the current organization
      if (!createTimesheetDto.organizationId) {
        createTimesheetDto.organizationId = organizationId;
      }

      const result = await this.timesheetsService.create(createTimesheetDto);

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error creating timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('generate')
  @UseGuards(PermissionGuard)
  @Auth('create_timesheet')
  async generate(@Body() generateDto: GenerateTimesheetDto, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // If organizationId not provided, use the current organization
      if (!generateDto.organizationId) {
        generateDto.organizationId = organizationId;
      }

      const result = await this.timesheetsService.generateTimesheet(
        generateDto
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error generating timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('generate-bulk')
  @UseGuards(PermissionGuard)
  @Auth('create_timesheet')
  async generateBulk(
    @Body() bulkDto: BulkGenerateTimesheetsDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      // Use organization ID from request if not provided in DTO
      const targetOrgId = bulkDto.organizationId || organizationId;

      const result = await this.timesheetsService.generateTimesheetsBulk(
        targetOrgId,
        bulkDto.workerIds,
        bulkDto.periodStart,
        bulkDto.periodEnd,
        bulkDto.periodType as any,
        bulkDto.departmentId
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error generating bulk timesheets: ${error.message}`,
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

      if (query.periodStart) {
        options.periodStart = new Date(query.periodStart);
      }

      if (query.periodEnd) {
        options.periodEnd = new Date(query.periodEnd);
      }

      if (query.workerId) {
        options.workerId = query.workerId;
      }

      if (query.departmentId) {
        options.departmentId = query.departmentId;
      }

      if (query.year !== undefined) {
        options.year = parseInt(query.year, 10);
      }

      if (query.month !== undefined) {
        options.month = parseInt(query.month, 10);
      }

      if (query.week !== undefined) {
        options.week = parseInt(query.week, 10);
      }

      if (query.search) {
        options.search = query.search;
      }

      const results = await this.timesheetsService.findAll(
        organizationId,
        options
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding all timesheets: ${error.message}`,
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

      let year: number | undefined;
      let month: number | undefined;
      let status: string[] | undefined;

      if (query.year !== undefined) {
        year = parseInt(query.year, 10);
      }

      if (query.month !== undefined) {
        month = parseInt(query.month, 10);
      }

      if (query.status) {
        status = Array.isArray(query.status) ? query.status : [query.status];
      }

      const results = await this.timesheetsService.findByWorker(
        organizationId,
        workerId,
        year,
        month,
        status
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding worker timesheets: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('period')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async findByPeriod(@Req() req: any, @Query() query: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      if (!query.startDate || !query.endDate) {
        throw new Error('startDate and endDate are required');
      }

      const periodStart = new Date(query.startDate);
      const periodEnd = new Date(query.endDate);

      let status: string[] | undefined;

      if (query.status) {
        status = Array.isArray(query.status) ? query.status : [query.status];
      }

      const results = await this.timesheetsService.getTimeSheetsByPeriod(
        organizationId,
        periodStart,
        periodEnd,
        status
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error finding timesheets by period: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, OrganizationContextGuard)
  async getStats(@Req() req: any, @Query() query: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      let periodStart: Date | undefined;
      let periodEnd: Date | undefined;

      if (query.startDate) {
        periodStart = new Date(query.startDate);
      }

      if (query.endDate) {
        periodEnd = new Date(query.endDate);
      }

      const results = await this.timesheetsService.getTimesheetStats(
        organizationId,
        periodStart,
        periodEnd
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error getting timesheet stats: ${error.message}`,
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

      const result = await this.timesheetsService.findOne(id, organizationId);

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error finding timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Put(':id')
  @Auth('edit_timesheet')
  async update(
    @Param('id') id: string,
    @Body() updateTimesheetDto: UpdateTimesheetDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.timesheetsService.update(
        id,
        organizationId,
        updateTimesheetDto
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error updating timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post(':id/action')
  @UseGuards(PermissionGuard)
  async processAction(
    @Param('id') id: string,
    @Body() approvalDto: TimesheetApprovalDto,
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      const userId = req.user.id;

      // Check permissions based on action
      switch (approvalDto.action) {
        case 'submit':
          // Workers can submit their own timesheets
          const timesheet = await this.timesheetsService.findOne(
            id,
            organizationId
          );
          const isOwnTimesheet = timesheet.workerId.toString() === userId;
          if (
            !isOwnTimesheet &&
            !req.user.permissions.includes('approve_timesheet')
          ) {
            throw new Error('Not authorized to submit this timesheet');
          }
          break;

        case 'approve':
        case 'reject':
        case 'reopen':
        case 'mark_paid':
          // These actions require approval permission
          if (!req.user.permissions.includes('approve_timesheet')) {
            throw new Error('Not authorized to perform this action');
          }
          break;
      }

      const result = await this.timesheetsService.processAction(
        id,
        organizationId,
        approvalDto.action as any,
        userId,
        approvalDto.comments
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error processing timesheet action: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Delete(':id')
  @Auth('delete_timesheet')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const organizationId = req.currentOrganization._id.toString();
      return await this.timesheetsService.remove(id, organizationId);
    } catch (error: any) {
      this.logger.error(
        `Error removing timesheet: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post('export-payroll')
  @Auth('export_timesheet')
  async exportForPayroll(
    @Body() exportData: { timesheetIds: string[]; payrollReference: string },
    @Req() req: any
  ) {
    try {
      const organizationId = req.currentOrganization._id.toString();

      const result = await this.timesheetsService.exportForPayroll(
        organizationId,
        exportData.timesheetIds,
        exportData.payrollReference
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error exporting timesheets for payroll: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
