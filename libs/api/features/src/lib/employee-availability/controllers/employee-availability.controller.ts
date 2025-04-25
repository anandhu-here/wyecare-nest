// employee-availability.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/jwt/jwt-auth.guard';
import { RequirePermission } from '../../authorization/permissions.decorator';
import {
  AvailabilityPeriod,
  CreateAvailabilityDto,
  GetAvailabilityQueryDto,
  GetAvailableEmployeesQueryDto,
  SingleDateAvailabilityDto,
  UpdateAvailabilityDto,
} from '../dto/employee-availability.dto';
import { Types } from 'mongoose';
import { OrganizationContextGuard } from '../../organizations/organization-context.guard';
import { EmployeeAvailabilityService } from '../services/employee-availability.service';

@Controller('employee-availability')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class EmployeeAvailabilityController {
  constructor(
    private readonly employeeAvailabilityService: EmployeeAvailabilityService
  ) {}

  /**
   * Create or update employee availability
   */
  @Post()
  @RequirePermission('manage_employee_availability')
  async createOrUpdateAvailability(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
    @Req() req: any
  ) {
    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();

    // Format availability entries
    const formattedEntries = createAvailabilityDto.availabilityEntries.map(
      (entry) => ({
        date: new Date(entry.date),
        period: entry.period,
      })
    );

    const availability =
      await this.employeeAvailabilityService.createOrUpdateAvailability({
        userId,
        organizationId,
        availabilityEntries: formattedEntries,
        effectiveFrom: new Date(createAvailabilityDto.effectiveFrom),
        effectiveTo: createAvailabilityDto.effectiveTo
          ? new Date(createAvailabilityDto.effectiveTo)
          : undefined,
        isRecurring: createAvailabilityDto.isRecurring,
      });

    return {
      success: true,
      data: availability,
    };
  }

  /**
   * Get availability for a date range
   */
  @Get()
  @RequirePermission('view_employee_availability')
  async getAvailability(
    @Query() queryParams: GetAvailabilityQueryDto,
    @Req() req: any
  ) {
    const organizationId = req.currentOrganization._id.toString();

    const availabilities =
      await this.employeeAvailabilityService.getAvailability({
        userId: queryParams.userId,
        organizationId,
        startDate: new Date(queryParams.startDate),
        endDate: new Date(queryParams.endDate),
      });

    return {
      success: true,
      data: availabilities,
    };
  }

  /**
   * Get current user's availability
   */
  @Get('me')
  async getCurrentUserAvailability(
    @Query() queryParams: GetAvailabilityQueryDto,
    @Req() req: any
  ) {
    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();

    const availabilities =
      await this.employeeAvailabilityService.getAvailability({
        userId,
        organizationId,
        startDate: new Date(queryParams.startDate),
        endDate: new Date(queryParams.endDate),
      });

    return {
      success: true,
      data: availabilities,
    };
  }

  /**
   * Update full availability data
   */
  @Put('update')
  async updateAvailability(
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
    @Req() req: any
  ) {
    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();

    // Process availability entries to ensure proper date format
    const processedEntries = updateAvailabilityDto.availabilityEntries.map(
      (entry) => ({
        date: new Date(entry.date),
        period: entry.period,
      })
    );

    const availability =
      await this.employeeAvailabilityService.updateAvailability({
        userId,
        organizationId,
        availabilityEntries: processedEntries,
        effectiveFrom: new Date(updateAvailabilityDto.effectiveFrom),
        effectiveTo: updateAvailabilityDto.effectiveTo
          ? new Date(updateAvailabilityDto.effectiveTo)
          : undefined,
        isRecurring: updateAvailabilityDto.isRecurring,
      });

    return {
      success: true,
      data: availability,
    };
  }

  /**
   * Update single date availability
   */
  @Put('date')
  async updateSingleDateAvailability(
    @Body() singleDateDto: SingleDateAvailabilityDto,
    @Req() req: any
  ) {
    const userId = req.user._id.toString();
    const organizationId = req.currentOrganization._id.toString();

    const availability =
      await this.employeeAvailabilityService.updateSingleDateAvailability({
        userId,
        organizationId,
        date: new Date(singleDateDto.date),
        period: singleDateDto.period,
      });

    return {
      success: true,
      data: availability,
    };
  }

  /**
   * Get availability for a specific employee
   */
  @Get('employee/:userId')
  @RequirePermission('view_employee_availability')
  async getEmployeeAvailability(
    @Param('userId') userId: string,
    @Req() req: any
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const organizationId = req.currentOrganization._id.toString();

    const availabilities =
      await this.employeeAvailabilityService.getEmployeeAvailability(
        userId,
        organizationId
      );

    return {
      success: true,
      data: availabilities,
    };
  }

  /**
   * Delete an availability record
   */
  @Delete(':id')
  @RequirePermission('manage_employee_availability')
  async deleteAvailability(@Param('id') id: string, @Req() req: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid availability record ID format');
    }

    const currentUserId = req.user._id.toString();

    await this.employeeAvailabilityService.deleteAvailability(
      id,
      currentUserId
    );

    return {
      success: true,
      message: 'Availability record deleted successfully',
    };
  }

  /**
   * Get available employees for a specific date and shift
   */
  @Get('available')
  @RequirePermission('view_employee_availability')
  async getAvailableEmployees(
    @Query() queryParams: GetAvailableEmployeesQueryDto,
    @Req() req: any
  ) {
    const organizationId = req.currentOrganization._id.toString();

    const employees =
      await this.employeeAvailabilityService.getAvailableEmployees({
        organizationId,
        date: new Date(queryParams.date),
        period: queryParams.period,
      });

    return {
      success: true,
      data: employees,
    };
  }
}
